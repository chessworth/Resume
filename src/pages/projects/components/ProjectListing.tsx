import "./ProjectListing.css";
import { getAssetUrl } from "../../../utils/viteUtils";

function ProjectListing({iconName, linkUrl, title, description} : {iconName : string, linkUrl : string, title : string, description : string}) {
    return (
        <div className="projectListing" onClick={() => window.location.href = linkUrl}>
            {// Temporarily removing icons
            /*<div className="icon"><img src={getAssetUrl(iconName)} alt="Project Thumbnail" /></div>*/}
            <div className="projectDetails">
                <div className="projectTitle">{title}</div>
                <div className="projectDescription">{description}</div>
            </div>
        </div>
    );
}
export default ProjectListing;