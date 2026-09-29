import {
  useEffect,
  useRef,
  useState
} from "react";

import AgentStatus from "./AgentStatus";
import CallControls from "./CallControls";


const API_URL =
  "http://localhost:5000/api/chat";


function VoiceAgent({
  onTranscriptUpdate,
  onCallEnd
}) {

  const [
    isCallActive,
    setIsCallActive
  ] = useState(false);


  const [
    status,
    setStatus
  ] = useState("idle");


  const recognitionRef =
    useRef(null);


  const isCallActiveRef =
    useRef(false);


  const shouldListenRef =
    useRef(false);


  /*
    Stores Gemini conversation history.

    Example:

    user -> where is my order
    model -> please provide order ID
    user -> 101
    model -> order 101 information
  */

  const historyRef =
    useRef([]);


  const processingRef =
    useRef(false);


  /* =======================================================
     SPEAK RESPONSE
  ======================================================= */

  const speakResponse = (text) => {

    return new Promise(
      (resolve) => {

        if (
          !window.speechSynthesis
        ) {

          resolve();
          return;

        }


        window.speechSynthesis.cancel();


        const utterance =
          new SpeechSynthesisUtterance(
            text
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


      processingRef.current =
        true;


      try {

        setStatus(
          "thinking"
        );


        console.log(
          "Customer:",
          message
        );


        /* ---------------------------------------------
           Show customer message
        --------------------------------------------- */

        onTranscriptUpdate({

          role: "user",

          content: message

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

                  message,

                  /*
                    Send previous conversation
                    to backend.
                  */

                  history:
                    historyRef.current

                })

            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "AI service failed."
          );

        }


        const reply =
          data.reply;


        console.log(
          "Aria:",
          reply
        );


        /* ---------------------------------------------
           IMPORTANT:

           Save customer message in history
           BEFORE sending next message.
        --------------------------------------------- */

        historyRef.current.push({

          role: "user",

          parts: [
            {
              text: message
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
              text: reply
            }
          ]

        });


        /* ---------------------------------------------
           Show Aria response
        --------------------------------------------- */

        onTranscriptUpdate({

          role: "agent",

          content: reply

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
            300
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
              500
            );

          }

        };


      recognition.onend =
        () => {

          console.log(
            "🎤 Listening stopped."
          );


          if (
            isCallActiveRef.current &&
            shouldListenRef.current &&
            !processingRef.current
          ) {

            setTimeout(
              () => {

                startListening();

              },
              300
            );

          }

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


      /*
        New call = clear old conversation.
      */

      historyRef.current =
        [];


      const greeting =
        "Hi! I'm Aria from Aura Skincare. How can I help you today?";


      onTranscriptUpdate({

        role: "agent",

        content:
          greeting

      });


      await speakResponse(
        greeting
      );


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