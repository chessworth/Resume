import "./ProjectListing.css";

function ProjectListing({iconName, linkUrl, title, description} : {iconName : string, linkUrl : string, title : string, description : string}) {
    return (
        <div className="projectListing" onClick={() => window.location.href = linkUrl}>
            <div className="icon"><img src={ require("../assets/"+ iconName +".png")} alt={iconName} /></div>
            <div className="projectDetails">
                <div className="projectTitle">{title}</div>
                <div className="projectDescription">{description}</div>
            </div>
        </div>
    );
}
export default ProjectListing;