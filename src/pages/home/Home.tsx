import React, { useEffect, useRef } from "react";
import "./Home.css";

const Home: React.FC = () => {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const setRef = (el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  };
  

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
    <div className="homepage scroll-container">
      <section className="section header" ref={el => setRef(el, 0)}>
        <h1>Gursimran Singh</h1>
        <p>Software Developer • Game Programmer • .NET Enthusiast</p>
      </section>

      <section className="section about" ref={el => setRef(el, 1)}>
        <h2>About Me</h2>
        <p>
          I'm a software developer based in Toronto with experience in web and game development. My career has spanned a range of technologies including Angular, C#, .NET Core, and Unreal Engine.
        </p>
        <ul className="highlights">
          <li>Improved game frame rates by 25% using Unreal Engine optimizations</li>
          <li>Reduced server response times by 25% using AWS Lambda functions</li>
          <li>Created and maintained over 30+ front-end views in enterprise-level Angular applications</li>
          <li>Developed REST APIs with 99.9% uptime and reliable performance</li>
        </ul>
      </section>

      <section className="section hobbies" ref={el => setRef(el, 2)}>
        <h2>Hobbies & Interests</h2>
        <p>
          Outside of coding, I enjoy playing and running Dungeons & Dragons, exploring game design theory, and contributing to open source side projects.
        </p>
      </section>
    </div>
  );
};

export default Home;
