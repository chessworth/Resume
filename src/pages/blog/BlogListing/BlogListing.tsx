import './BlogListing.css';

function BlogListing({linkUrl, title, description} : {linkUrl : string, title : string, description : string}) {
    // accept the title and description as prop and return a listing

    return (
        <div>
            <h1 className='listingTitle'><a href={linkUrl}>{title}</a></h1>
            <p className='listingDescription'>{description}</p>
        </div>
    )
}
export default BlogListing;