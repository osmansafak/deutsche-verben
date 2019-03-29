import React, { useEffect, useState } from "react";
import styled from "styled-components";
import cx from "classnames";
import axios from "axios";
import Speech from "speak-tts";
import ReactGA from "react-ga";

import i18n from "./i18n";
import langData from "./language";

const Header = styled.header`
  background-image: url("/logo.png");
  background-position: center center;
  background-size: 75px;
  background-repeat: no-repeat;
  height: 75px;
  z-index: 1;
  button {
    position: absolute;
    top: 10px;
    right: 5px;
    img {
      width: 40px;
      height: 40px;
    }
  }
`;

const Main = styled.div`
  width: 100%;
  height: calc(100vh - 75px);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  .verb {
    font-size: 32px;
    font-weight: 700;
    margin: 20px 0;
    color: red;
  }
  .speech {
    width: 40px;
    height: 40px;
    margin-bottom: 30px;
    border-radius: 50%;
    background-color: #ffcc00;
  }
  .answers {
    width: 100%;
    li {
      width: 100%;
      border: 1px solid #626977;
      border-radius: 4px;
      background-color: #f7f7f7;
      & + li {
        margin-top: 10px;
      }
      &.correct {
        background-color: #06c000;
        border-color: white;
        button {
          color: white;
        }
      }
      &.wrong {
        background-color: #cc0000;
        border-color: white;
        button {
          color: white;
        }
      }
      button {
        width: 100%;
        padding: 10px 8px;
      }
    }
  }
  .verb-button {
    width: 100%;
    padding: 10px 8px;
    border-radius: 4px;
    background-color: #ffbc00;
    color: white;
    margin-top: 25px;
  }
  .next-button {
    width: 100%;
    padding: 10px 8px;
    border-radius: 4px;
    background-color: #006699;
    color: white;
    margin-top: 15px;
  }
`;

const Modal = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow-y: scroll;
  padding: 60px 10px 10px;
  background-color: #f7f7f7;
  z-index: 99;
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 50px;
    padding: 0 10px;
    background-color: white;
    border-bottom: 2px solid #ffcc00;
    font-weight: 700;
    z-index: 99;
    .title {
      font-size: 18px;
      color: red;
    }
    .close {
      color: black;
    }
  }
  .list {
    & + .list {
      margin-top: 15px;
      border-top: 1px solid #dddddd;
      padding-top: 15px;
    }

    li {
      color: red;
      margin-top: 8px;
    }
    span,
    strong {
      color: #333333;
    }
  }
`;

const Language = styled.ul`
  background-color: white;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 99;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  li {
    width: 90%;
    button {
      display: flex;
      align-items: center;
      width: 100%;
      height: 60px;
      padding-left: 70px;
      border: 1px solid #dddddd;
      border-radius: 4px;
      background-color: white;
      background-position: 10px 50%;
      background-repeat: no-repeat;
      background-size: 40px 40px;
      font-size: 18px;
    }
  }
`;

function App() {
  const [data, setData] = useState([]);
  const [lang, setLang] = useState("en");
  const [showLang, setShowLang] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [verb, setVerb] = useState(-1);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkData();
    ReactGA.initialize("UA-136971806-1", { testMode: true });
  }, []);

  useEffect(() => {
    if (selected > 0) {
      ReactGA.event({
        category: "Verb",
        action: "Click",
        label: quiz[verb].verb,
        value: verb + 1 === selected ? 1 : 0
      });
    }
  }, [selected]);

  useEffect(() => {
    if (verb > -1 && quiz && quiz.length > 0 && quiz.length >= verb) {
      ReactGA.event({
        category: "Verb",
        action: "View",
        label: quiz[verb].verb
      });
    }
  }, [verb]);

  useEffect(() => {
    localStorage.setItem("verben", JSON.stringify(data));
    changeQuiz();
  }, [data]);

  useEffect(() => {
    if (quiz[0]) {
      setLoading(false);
      setVerb(Math.floor(Math.random() * quiz.length));
    }
  }, [quiz]);

  const checkData = async () => {
    if (!localStorage.getItem("lang")) {
      await setShowLang(true);
    } else {
      setLang(localStorage.getItem("lang"));
    }
    let verben = localStorage.getItem("verben")
      ? JSON.parse(localStorage.getItem("verben"))
      : [];
    if (verben && verben.length > 0) {
      await setData(verben);
    } else {
      const verbenData = await axios.get("/verben.json");
      const scoreData = verbenData.data.map(item => {
        return { ...item, score: 0 };
      });
      setData(scoreData);
    }
  };

  const changeQuiz = () => {
    setLoading(true);
    setSelected(0);
    let newQuiz = [];
    while (newQuiz.length < 4) {
      let rand = Math.floor(Math.random() * data.length);
      newQuiz = [...newQuiz, data[rand]];
    }
    setQuiz(newQuiz);
  };

  const speechText = () => {
    const speech = new Speech();
    speech
      .init({
        volume: 1,
        rate: 1,
        pitch: 1
      })
      .catch(e => {
        console.error("An error occured while initializing : ", e);
      });
    speech.setLanguage("de-DE");
    speech
      .speak({
        text: quiz[verb].verb,
        queue: false
      })
      .catch(e => {
        console.error("An error occurred :", e);
      });
    ReactGA.event({
      category: "Verb",
      action: "Speech",
      label: quiz[verb].verb
    });
  };

  return (
    <div className="App">
      <Header>
        <button onClick={() => setShowLang(true)}>
          <img src={`/flag/${lang}.png`} alt="language" />
        </button>
      </Header>
      <Main>
        {loading ? (
          <div>loading</div>
        ) : (
          <>
            <div className="verb">{quiz[verb].verb}</div>
            <button onClick={() => speechText()}>
              <img src="/volume.svg" alt="speech" className="speech" />
            </button>
            <ul className="answers">
              {quiz.map((item, index) => (
                <li
                  className={cx({
                    wrong:
                      selected > 0 &&
                      index + 1 !== verb + 1 &&
                      index + 1 === selected,
                    correct: selected > 0 && index + 1 === verb + 1
                  })}
                  key={item.verb}
                >
                  <button
                    onClick={() => {
                      setSelected(Math.floor(index + 1));
                    }}
                  >
                    {item.data.translate[lang].join(", ")}
                  </button>
                </li>
              ))}
            </ul>
            <button className="verb-button" onClick={() => setShowModal(true)}>
              {i18n.verb[lang]}
            </button>
            <button className="next-button" onClick={() => changeQuiz()}>
              {i18n.next[lang]}
            </button>
          </>
        )}
      </Main>
      {showModal && (
        <Modal>
          <div className="header">
            <div className="title">{i18n.verb[lang]}</div>
            <button onClick={() => setShowModal(false)}>
              {i18n.close[lang]}
            </button>
          </div>
          {!loading && (
            <div className="modal-main">
              {quiz[verb].data.konjugation.map(item => (
                <div className="list" key={item.title}>
                  <strong>{item.title}</strong>
                  <ul>
                    {item.verb.map(subItem => (
                      <li key={subItem.person}>
                        {subItem.person} <span>{subItem.result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {showLang && (
        <Language>
          {langData.map(item => (
            <li key={item.code}>
              <button
                onClick={() => {
                  localStorage.setItem("lang", item.code);
                  setLang(item.code);
                  setShowLang(false);
                }}
                style={{ backgroundImage: `url(/flag/${item.code}.png)` }}
              >
                {item.language}
              </button>
            </li>
          ))}
        </Language>
      )}
    </div>
  );
}

export default App;
