import type { MetaFunction } from '@remix-run/node';
import NavBar from '~/components/NavBar';
import { H2 } from '~/components/ui/H2';
import { H3 } from '~/components/ui/H3';
import { Button } from '~/components/ui/button';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
    return [
        { title: '42 Vienna Student Council' },
        { name: 'description', content: 'Welcome to the website of the 42 Vienna Student Council.' },
    ];
};

export default function Index() {
    return (
        <div>
            <NavBar />
            <div className='flex flex-col items-center mt-80 mb-80'>
                <div className='flex flex-col items-center mb-4 text-7xl md:text-8xl font-bold'>
                    <p>STUDENT</p>
                    <p>COUNCIL</p>
                </div>
                <p className='text-2xl text-center text-slate-600 mb-4'>
                    Official Website of the 42 Vienna Student Council
                </p>
                <Button variant='destructive'>
                    <Link to='/issues'>Have a problem?</Link>
                </Button>
            </div>
            <div className='flex flex-col md:flex-row md:items-center'>
                <img
                    src='/img/landing-page.png'
                    alt='Landing Page'
                    className='mx-4 mb-4 rounded md:size-6/12 shadow-md md:shadow-2xl'
                />
                <div className='mx-4'>
                    <div className='mb-4'>
                        <H2 className='mb-2'>What is the Student Council?</H2>
                        <p>
                            We are students who have been elected by our peers to represent them in the school's
                            decision making process. This is a platform for you to anonymously share your thoughts,
                            ideas, and concerns with us.
                        </p>
                    </div>
                    <div>
                        <H3>Why?</H3>
                        <ul className='ml-4'>
                            <li>
                                Because we want <span className='font-bold'>everyone to be heard</span>.
                            </li>
                            <li>
                                Because we want <span className='font-bold'>transparent communication</span>.
                            </li>
                            <li>
                                Because we want <span className='font-bold'>to make a difference</span>.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className='my-4'>TODO</div>
        </div>
    );
}