import './Blog.css';
import BlogListing from './BlogListing/BlogListing';

function Blog() {
    return (
        <div className='pageContainer'>
            <h1 className='title'>Blog</h1>   
            <ul className='blogList'>
                <li><BlogListing linkUrl="/blog" title="Blog 1" description="Description for Blog 1" /></li>
                <li><BlogListing linkUrl="/blog" title="Blog 2" description="Description for Blog 2" /></li>
                <li><BlogListing linkUrl="/blog" title="Blog 3" description="Description for Blog 3" /></li>
            </ul>
        </div>
    )
}
export default Blog;