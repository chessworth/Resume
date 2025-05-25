import './Blog.css';
import BlogListing from './BlogListing/BlogListing';
import blogs from '../../data/blogs.json';
import { useSearchParams } from 'react-router-dom';

const Blog: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const id = searchParams.get("id");
    if (id !== null) {
        const blog = blogs.find((blog) => blog.id === Number(id));
        return (
            <div className='pageContainer blogContainer'>
                <h1 className='title'>{blog?.name}</h1>   
                <div dangerouslySetInnerHTML={{ __html: blog?.body || '' }} />
            </div>
        )
    }
    return (
        <div className='pageContainer'>
            <h1 className='title'>Blog</h1>   
            <ul className='blogList'>
                {blogs.map((blog) => (
                    <li key={blog.id}><BlogListing linkUrl={"/blog?id=" + blog.id} title={blog.name} description={blog.description} /></li>
                ))}
            </ul>
        </div>
    )
}
export default Blog;