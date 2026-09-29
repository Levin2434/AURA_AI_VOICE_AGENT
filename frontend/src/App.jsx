import {
  useRef,
  useState
} from "react";

import Header from "./components/Header";
import VoiceAgent from "./components/VoiceAgent";
import OrderPanel from "./components/OrderPanel";
import Transcript from "./components/Transcript";
import CallSummary from "./components/CallSummary";


const SUMMARY_API_URL =
  "http://localhost:5000/api/summary";


function App() {

  const [
    messages,
    setMessages
  ] = useState([]);


  const [
    summary,
    setSummary
  ] = useState(null);


  /*
    Keeps the latest messages immediately available.

    This avoids React state timing problems
    when the call ends.
  */

  const messagesRef =
    useRef([]);


  /* =======================================================
     ADD TRANSCRIPT MESSAGE
  ======================================================= */

  const addTranscriptMessage =
    (message) => {

      messagesRef.current = [

        ...messagesRef.current,

        message

      ];


      setMessages(
        messagesRef.current
      );

    };


  /* =======================================================
     CALL END
  ======================================================= */

  const handleCallEnd =
    async () => {

      console.log(
        "📞 Call ended"
      );


      const currentMessages =
        messagesRef.current;


      if (
        currentMessages.length === 0
      ) {

        console.log(
          "No conversation to summarize."
        );

        return;

      }


      try {

        console.log(
          "📝 Generating local call summary..."
        );


        const response =
          await fetch(
            SUMMARY_API_URL,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({

                  messages:
                    currentMessages

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
            "Failed to generate call summary."
          );

        }


        console.log(
          "✅ Call summary:",
          data.summary
        );


        setSummary(
          data.summary
        );


      } catch (error) {

        console.error(
          "❌ Call summary error:",
          error
        );


        setSummary({

          customer_intent:
            "Unknown",

          order_id:
            null,

          resolution_status:
            "Unresolved",

          call_summary:
            "The call ended, but a structured summary could not be generated.",

          action_items:
            []

        });

      }

    };


  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="app">

      <Header />


      <main className="main-container">

        <section className="left-column">

          <VoiceAgent

            onTranscriptUpdate={
              addTranscriptMessage
            }

            onCallEnd={
              handleCallEnd
            }

          />


          <OrderPanel />

        </section>


        <section className="right-column">

          <Transcript
            messages={
              messages
            }
          />


          <CallSummary
            summary={
              summary
            }
          />

        </section>

      </main>

    </div>

  );

}


export default App;