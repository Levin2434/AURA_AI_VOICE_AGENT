import {
  useEffect,
  useRef,
  useState
} from "react";

import AgentStatus from "./AgentStatus";
import CallControls from "./CallControls";


const API_URL =
  "https://aura-ai-voice-agent.onrender.com/api/chat";


function VoiceAgent({
  onTranscriptUpdate,
  onCallEnd
}) {

  /* =======================================================
     CALL STATE
  ======================================================= */

  const [
    isCallActive,
    setIsCallActive
  ] = useState(false);


  const [
    status,
    setStatus
  ] = useState("idle");


  /* =======================================================
     REFS
  ======================================================= */

  const recognitionRef =
    useRef(null);


  const isCallActiveRef =
    useRef(false);


  const shouldListenRef =
    useRef(false);


  /*
    Stores Gemini conversation history.
  */

  const historyRef =
    useRef([]);


  /*
    Prevents multiple AI requests
    at the same time.
  */

  const processingRef =
    useRef(false);


  /*
    Prevent duplicate speech-recognition
    results.

    Chrome can occasionally return the
    same transcript more than once.
  */

  const lastTranscriptRef =
    useRef("");


  const lastTranscriptTimeRef =
    useRef(0);


  /*
    Prevent duplicate call starts.
  */

  const callStartingRef =
    useRef(false);


  /* =======================================================
     SPEAK RESPONSE
  ======================================================= */

  const speakResponse = (text) => {

    return new Promise(
      (resolve) => {

        if (
          !text ||
          !window.speechSynthesis
        ) {

          resolve();
          return;
        }


        window.speechSynthesis.cancel();


        const utterance =
          new SpeechSynthesisUtterance(
            String(text)
          );


        utterance.lang =
          "en-IN";


        utterance.rate =
          1.05;


        utterance.pitch =
          1;


        utterance.onstart =
          () => {

            setStatus(
              "speaking"
            );

          };


        utterance.onend =
          () => {

            if (
              isCallActiveRef.current
            ) {

              setStatus(
                "listening"
              );

            }


            resolve();

          };


        utterance.onerror =
          () => {

            if (
              isCallActiveRef.current
            ) {

              setStatus(
                "listening"
              );

            }


            resolve();

          };


        window.speechSynthesis.speak(
          utterance
        );

      }
    );

  };


  /* =======================================================
     SEND MESSAGE TO AI
  ======================================================= */

  const sendMessageToAI =
    async (message) => {

      if (
        !message ||
        processingRef.current
      ) {

        return;

      }


      const cleanMessage =
        String(message).trim();


      if (!cleanMessage) {
        return;
      }


      processingRef.current =
        true;


      try {

        setStatus(
          "thinking"
        );


        console.log(
          "Customer:",
          cleanMessage
        );


        /* ---------------------------------------------
           Show customer message
        --------------------------------------------- */

        onTranscriptUpdate({

          role: "user",

          content:
            cleanMessage

        });


        /* ---------------------------------------------
           Send request
        --------------------------------------------- */

        const response =
          await fetch(
            API_URL,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({

                  message:
                    cleanMessage,

                  history:
                    historyRef.current

                })

            }
          );


        const data =
          await response.json();


        console.log(
          "Backend response:",
          data
        );


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "AI service failed."
          );

        }


        /*
          IMPORTANT:

          Support both backend formats:

          {
            response: "..."
          }

          and

          {
            reply: "..."
          }
        */

        const reply =
          data.response ||
          data.reply;


        if (
          !reply ||
          typeof reply !== "string"
        ) {

          throw new Error(
            "Backend returned an empty AI response."
          );

        }


        console.log(
          "Aria:",
          reply
        );


        /* ---------------------------------------------
           Save customer message in Gemini history
        --------------------------------------------- */

        historyRef.current.push({

          role: "user",

          parts: [
            {
              text:
                cleanMessage
            }
          ]

        });


        /* ---------------------------------------------
           Save Aria response
        --------------------------------------------- */

        historyRef.current.push({

          role: "model",

          parts: [
            {
              text:
                reply
            }
          ]

        });


        /* ---------------------------------------------
           Show Aria response
        --------------------------------------------- */

        onTranscriptUpdate({

          role: "agent",

          content:
            reply

        });


        /* ---------------------------------------------
           Speak response
        --------------------------------------------- */

        await speakResponse(
          reply
        );


      } catch (error) {

        console.error(
          "AI request error:",
          error
        );


        const errorMessage =
          "I'm sorry, I'm having trouble connecting right now. Please try again.";


        onTranscriptUpdate({

          role: "agent",

          content:
            errorMessage

        });


        await speakResponse(
          errorMessage
        );


      } finally {

        processingRef.current =
          false;


        if (
          isCallActiveRef.current &&
          shouldListenRef.current
        ) {

          setTimeout(
            () => {

              startListening();

            },
            500
          );

        }

      }

    };


  /* =======================================================
     START LISTENING
  ======================================================= */

  const startListening =
    () => {

      if (
        !isCallActiveRef.current
      ) {

        return;

      }


      if (
        !shouldListenRef.current
      ) {

        return;

      }


      if (
        processingRef.current
      ) {

        return;

      }


      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


      if (
        !SpeechRecognition
      ) {

        alert(
          "Speech recognition is not supported. Please use Google Chrome."
        );

        return;

      }


      /*
        Stop any old recognition instance
        before creating a new one.
      */

      if (
        recognitionRef.current
      ) {

        try {

          recognitionRef.current.abort();

        } catch (error) {}

      }


      const recognition =
        new SpeechRecognition();


      recognition.lang =
        "en-IN";


      recognition.continuous =
        false;


      recognition.interimResults =
        false;


      recognition.maxAlternatives =
        1;


      recognition.onstart =
        () => {

          console.log(
            "🎤 Listening..."
          );


          setStatus(
            "listening"
          );

        };


      recognition.onresult =
        async (event) => {

          if (
            processingRef.current
          ) {

            return;

          }


          const transcript =
            event
              .results[0][0]
              .transcript
              .trim();


          if (!transcript) {

            return;

          }


          /*
            Prevent duplicate recognition results.

            If Chrome gives us the exact same
            transcript within 2 seconds, ignore it.
          */

          const now =
            Date.now();


          if (
            transcript.toLowerCase() ===
              lastTranscriptRef.current.toLowerCase() &&
            now -
              lastTranscriptTimeRef.current <
              2000
          ) {

            console.log(
              "Ignoring duplicate transcript:",
              transcript
            );

            return;

          }


          lastTranscriptRef.current =
            transcript;


          lastTranscriptTimeRef.current =
            now;


          console.log(
            "🎤 Heard:",
            transcript
          );


          try {

            recognition.stop();

          } catch (error) {}


          await sendMessageToAI(
            transcript
          );

        };


      recognition.onerror =
        (event) => {

          console.error(
            "Speech recognition error:",
            event.error
          );


          if (
            event.error ===
              "not-allowed" ||
            event.error ===
              "service-not-allowed"
          ) {

            setStatus(
              "idle"
            );

            return;

          }


          if (
            isCallActiveRef.current &&
            shouldListenRef.current &&
            !processingRef.current
          ) {

            setTimeout(
              () => {

                startListening();

              },
              700
            );

          }

        };


      recognition.onend =
        () => {

          console.log(
            "🎤 Listening stopped."
          );


          /*
            Do NOT immediately restart here.

            sendMessageToAI() will restart
            listening after the AI response.
          */

        };


      recognitionRef.current =
        recognition;


      try {

        recognition.start();

      } catch (error) {

        console.error(
          "Could not start microphone:",
          error
        );

      }

    };


  /* =======================================================
     START CALL
  ======================================================= */

  const startCall =
    async () => {

      /*
        Prevent accidental double-click /
        duplicate call initialization.
      */

      if (
        callStartingRef.current ||
        isCallActiveRef.current
      ) {

        return;

      }


      callStartingRef.current =
        true;


      console.log(
        "📞 Starting call..."
      );


      setIsCallActive(
        true
      );


      isCallActiveRef.current =
        true;


      shouldListenRef.current =
        true;


      processingRef.current =
        false;


      /*
        Clear previous conversation.
      */

      historyRef.current =
        [];


      lastTranscriptRef.current =
        "";


      lastTranscriptTimeRef.current =
        0;


      const greeting =
        "Hi! I'm Aria from Aura Skincare. How can I help you today?";


      /*
        Add greeting only once.
      */

      onTranscriptUpdate({

        role: "agent",

        content:
          greeting

      });


      await speakResponse(
        greeting
      );


      callStartingRef.current =
        false;


      if (
        isCallActiveRef.current &&
        shouldListenRef.current
      ) {

        startListening();

      }

    };


  /* =======================================================
     END CALL
  ======================================================= */

  const endCall =
    () => {

      console.log(
        "📞 Ending call..."
      );


      callStartingRef.current =
        false;


      shouldListenRef.current =
        false;


      isCallActiveRef.current =
        false;


      processingRef.current =
        false;


      setIsCallActive(
        false
      );


      setStatus(
        "idle"
      );


      if (
        recognitionRef.current
      ) {

        try {

          recognitionRef.current.abort();

        } catch (error) {}


        recognitionRef.current =
          null;

      }


      if (
        window.speechSynthesis
      ) {

        window.speechSynthesis.cancel();

      }


      onCallEnd();

    };


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(
    () => {

      return () => {

        shouldListenRef.current =
          false;


        isCallActiveRef.current =
          false;


        callStartingRef.current =
          false;


        if (
          recognitionRef.current
        ) {

          try {

            recognitionRef.current.abort();

          } catch (error) {}

        }


        if (
          window.speechSynthesis
        ) {

          window.speechSynthesis.cancel();

        }

      };

    },
    []
  );


  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="voice-agent">

      <div className="agent-avatar">
        🤖
      </div>


      <h2>
        Aria
      </h2>


      <p className="agent-description">
        Aura Skincare's AI customer support specialist
      </p>


      <AgentStatus
        status={status}
      />


      <CallControls

        isCallActive={
          isCallActive
        }

        onStartCall={
          startCall
        }

        onEndCall={
          endCall
        }

      />

    </div>

  );

}


export default VoiceAgent;