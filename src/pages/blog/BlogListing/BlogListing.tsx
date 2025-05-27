import { NavLink } from 'react-router-dom';
import './BlogListing.css';

function BlogListing({linkUrl, title, description, date} : {linkUrl : string, title : string, description : string, date : Date}) {
    // accept the title and description as prop and return a listing

    return (
        <div>
            <div className='listingHeader'><h1 className='listingTitle'><NavLink to={linkUrl}>{title}</NavLink></h1><h3>{date.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + date.getDate() + ' ' + date.toLocaleDateString('en-US', { month: 'long' }) + ' ' + date.getFullYear()}</h3></div>
            <p className='listingDescription'>{description.length > 150 ? description.substring(0, 150) + '...' : description}</p>
        </div>
    )
}
export default BlogListing;