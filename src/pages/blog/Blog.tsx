import './Blog.css';
import BlogListing from './BlogListing/BlogListing';
import blogs from '../../data/blogs.json';
import { useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import { DarkModeContext } from '../../contexts/DarkModeContext';

const Blog: React.FC = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const darkMode = useContext(DarkModeContext) ? 'dark' : 'light';
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
        <div className={'pageContainer ' + darkMode}>
            <h1 className='title'>Blog</h1>   
            <ul className='blogList'>
                {blogs.sort((a, b) => {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                }).map((blog) => (
                    <li key={blog.id}><BlogListing linkUrl={"/blog?id=" + blog.id} title={blog.name} description={blog.description} date={new Date(blog.date)} /></li>
                ))}
            </ul>
        </div>
    )
}
export default Blog;