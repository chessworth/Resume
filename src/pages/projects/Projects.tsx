import ProjectListing from "./components/ProjectListing";
import projects from "../../data/projects.json";
import "./Projects.css";

function Projects() {
    return (
        <div className="pageContainer">
            <h1 className="title">Projects</h1>
            <ul className='projectList'>
                {projects.map((project) => (
                    <li key={project.id}><ProjectListing iconName={project.iconName} linkUrl={project.url} title={project.name} description={project.description}/></li>
                ))}
            </ul>
        </div>
    );
}
export default Projects;