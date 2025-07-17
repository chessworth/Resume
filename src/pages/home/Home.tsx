import React, { useContext, useEffect, useRef } from "react";
import "./Home.css";
import { DarkModeContext } from "../../contexts/DarkModeContext";

const Home: React.FC = () => {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const setRef = (el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  };
  
  const theme = useContext(DarkModeContext) ? 'dark' : 'light';

  useEffect(() => {
    const options = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
        else {
          entry.target.classList.remove("visible");
        }
      });
    }, options);

    sectionRefs.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={"homepage scroll-container " + theme}>
      <section className="section header" ref={el => setRef(el, 0)}>
        <h1 className="sectionHeading">Gursimran Singh</h1>
        <div className="sectionBody">
            <p>Software Developer • Game Programmer • .NET Enthusiast</p>
        </div>
      </section>

      <section className="section about" ref={el => setRef(el, 1)}>
        <h2 className="sectionHeading">About Me</h2>
        <div className="sectionBody">
            <p>
            I'm a software developer based in the GTA with experience in website, application and game development.<br></br> My career has spanned a range of technologies including Angular, C#, .NET Core, and Unreal Engine.
            </p>
            <ul className="highlights">
                <li>3+ years of professional experience in full-stack and game development</li>
                <li>Specialized in Angular, .NET Core, C#, and modern C++</li>
                <li>High Honours graduate, Sheridan College Software Engineering (2021)</li>
                <li>Led and contributed to projects across web, mobile, and Windows desktop platforms</li>
            </ul>
        </div>
      </section>

      <section className="section hobbies" ref={el => setRef(el, 2)}>
        <h2 className="sectionHeading">Hobbies & Interests</h2>
        <p>
          Outside of coding, I enjoy a bunch of hobbies including but not limited to:
          <ul className="hobbiesList">
            <li>Reading (primarily fantasy novels, but I will give anything a shot)</li>
            <li>Music (mostly listening, some messing around with a piano or harmonica)</li>
            <li>Writing, mostly short form like poetry but I intend to write a novel one day</li>
          </ul>
        </p>
      </section>
    </div>
  );
};

export default Home;
