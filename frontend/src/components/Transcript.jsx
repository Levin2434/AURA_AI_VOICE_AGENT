function Transcript({ messages }) {

  return (

    <section className="transcript-panel">

      <div className="section-title">

        <h2>
          Conversation
        </h2>

      </div>


      <div className="transcript">

        {messages.length === 0 ? (

          <div className="empty-transcript">

            <div className="empty-icon">
              🎙️
            </div>


            <h3>
              No conversation yet
            </h3>


            <p>
              Click "Start Call" and speak with Aria.
            </p>

          </div>

        ) : (

          messages.map(
            (message, index) => (

              <div
                className={
                  `message ${
                    message.role === "user"
                      ? "user-message"
                      : "agent-message"
                  }`
                }
                key={index}
              >

                <span className="message-role">

                  {
                    message.role === "user"
                      ? "You"
                      : "Aria"
                  }

                </span>


                <p>
                  {message.content}
                </p>

              </div>

            )
          )

        )}

      </div>

    </section>

  );

}


export default Transcript;