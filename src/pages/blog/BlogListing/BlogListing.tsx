import { NavLink } from 'react-router-dom';
import './BlogListing.css';

function BlogListing({linkUrl, title, description} : {linkUrl : string, title : string, description : string}) {
    // accept the title and description as prop and return a listing

    return (
        <div>
            <h1 className='listingTitle'><NavLink to={linkUrl}>{title}</NavLink></h1>
            <p className='listingDescription'>{description.length > 150 ? description.substring(0, 150) + '...' : description}</p>
        </div>
    )
}
export default BlogListing;