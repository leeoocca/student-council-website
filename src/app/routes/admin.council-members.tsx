import { Prisma } from '@prisma/client';
import { ActionFunctionArgs, json, MetaFunction } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import classNames from 'classnames';
import { Info, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { FormErrorMessage } from '~/components/FormErrorMessage';
import { H3 } from '~/components/ui/H3';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { db } from '~/utils/db.server';
import { getAccessToken } from '~/utils/oauth.server';
import { requireAdmin } from '~/utils/session.server';
import { validateForm } from '~/utils/validation';

export const meta: MetaFunction = () => {
    return [{ title: 'Admin | Council Members' }, { name: 'description', content: 'Admin Page' }];
};

const LOGIN_MIN_LENGTH = 3;
const LOGIN_MAX_LENGTH = 20;

const addCouncilMemberSchema = z.object({
    newLogin: z
        .string()
        .min(LOGIN_MIN_LENGTH, `Login must be at least ${LOGIN_MIN_LENGTH} characters long.`)
        .max(LOGIN_MAX_LENGTH, `Login must be at most ${LOGIN_MAX_LENGTH} characters long.`),
});

const deleteCouncilMemberSchema = z.object({
    login: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
    await requireAdmin(request);

    const formData = await request.formData();
    const action = formData.get('_action');

    switch (action) {
        case 'add': {
            return validateForm(
                formData,
                addCouncilMemberSchema,
                (errors) => json({ errors }, 400),
                async (data) => {
                    const token = await getAccessToken();

                    // TODO: check for existing
                    // TODO: check for vulnerability
                    const res = await fetch(`https://api.intra.42.fr/v2/users/${encodeURIComponent(data.newLogin)}/`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!res.ok) {
                        return json({ errors: { newLogin: 'User not found' } }, 400);
                    }

                    const user = await res.json();

                    try {
                        const newMember = await db.councilMember.create({
                            data: {
                                login: user.login,
                                firstName: user.first_name,
                                lastName: user.last_name,
                                email: user.email,
                                profilePictureUrl: user.image.link,
                            },
                        });

                        await db.user.upsert({
                            where: {
                                id: user.login,
                            },
                            update: {
                                role: 'ADMIN',
                            },
                            create: {
                                id: user.login,
                                role: 'ADMIN',
                            },
                        });

                        return newMember;
                    } catch (e) {
                        if (e instanceof Prisma.PrismaClientKnownRequestError) {
                            // code if member already exists
                            if (e.code === 'P2002') {
                                return json({ errors: { newLogin: 'Council member already exists' } }, 400);
                            }
                        }

                        throw e;
                    }
                },
            );
        }
        case 'delete': {
            return validateForm(
                formData,
                deleteCouncilMemberSchema,
                (errors) => json({ errors }, 400),
                async (data) => {
                    try {
                        await db.councilMember.delete({
                            where: {
                                login: data.login,
                            },
                        });

                        await db.user.upsert({
                            where: {
                                id: data.login,
                            },
                            update: {
                                role: 'USER',
                            },
                            create: {
                                id: data.login,
                                role: 'USER',
                            },
                        });

                        return json({ success: true });
                    } catch (e) {
                        if (e instanceof Prisma.PrismaClientKnownRequestError) {
                            if (e.code === 'P2025') {
                                return json({ errors: { login: 'Council member does not exist' } }, 400);
                            }
                        }

                        return json({ success: true });
                    }
                },
            );
        }
        default:
            console.log(formData);
            throw new Error('Invalid action');
    }
}

export async function loader() {
    const data = await db.councilMember.findMany();

    return data.sort((a, b) => a.firstName.localeCompare(b.firstName));
}

type LoaderData = Prisma.CouncilMemberGetPayload<{}>[];

function CouncilMember({
    login,
    firstName,
    lastName,
    className,
}: { login: string; firstName: string; lastName: string } & React.HTMLAttributes<HTMLDivElement>) {
    const deleteFetcher = useFetcher<{ errors?: { login?: string } }>();

    return (
        <>
            <li className={classNames('flex flex-row justify-between', className)}>
                <div className='flex items-baseline'>
                    <pre>{login.padEnd(9)}</pre> {firstName} {lastName}
                </div>
                <deleteFetcher.Form method='post'>
                    <input type='hidden' name='_action' value='delete' />
                    <input type='hidden' name='login' value={login} />
                    <button type='submit'>
                        <Trash2 className='text-red-500' />
                    </button>
                </deleteFetcher.Form>
            </li>
            <FormErrorMessage className='mt-2'>{deleteFetcher.data?.errors?.login}</FormErrorMessage>
        </>
    );
}

export default function AdminCouncilMembers() {
    const addCouncilMemberFetcher = useFetcher<{ errors?: { newLogin?: string } }>();

    const data = useLoaderData<LoaderData>();

    const [newLogin, setNewLogin] = useState('');
    const [isButtonInvalid, setIsButtonInvalid] = useState(true);

    useEffect(() => {
        let isLoginValid = true;
        try {
            addCouncilMemberSchema.shape.newLogin.parse(newLogin);
        } catch (e) {
            isLoginValid = false;
        }

        setIsButtonInvalid(!isLoginValid || !!addCouncilMemberFetcher.data?.errors?.newLogin);
    }, [newLogin, addCouncilMemberFetcher.data]);

    return (
        <div className='flex flex-col gap-y-4'>
            <H3>Add Council Member</H3>
            <addCouncilMemberFetcher.Form method='post'>
                <div className='flex flex-row'>
                    <Input
                        placeholder='Login'
                        name='newLogin'
                        autoComplete='off'
                        required
                        minLength={LOGIN_MIN_LENGTH}
                        maxLength={LOGIN_MAX_LENGTH}
                        value={newLogin}
                        onChange={(e) => setNewLogin(e.target.value)}
                    />
                    <Button type='submit' name='_action' value='add' className='ml-4' invalid={isButtonInvalid}>
                        Add
                    </Button>
                </div>
                <FormErrorMessage className='mt-2'>{addCouncilMemberFetcher.data?.errors?.newLogin}</FormErrorMessage>
            </addCouncilMemberFetcher.Form>
            <Alert variant='destructive'>
                <Info className='h-4 w-4' />
                <AlertTitle>Warning!</AlertTitle>
                <AlertDescription>
                    Student Council members will automatically have{' '}
                    <span className='font-bold uppercase'>Administrator</span> access to this website.
                    <br />
                    Please make sure to only add real student council members, and don't add someone for trolling.
                </AlertDescription>
            </Alert>

            <H3>Current Council Members</H3>
            <ul>
                {data.map((member, i) => (
                    <CouncilMember
                        key={member.login}
                        login={member.login}
                        firstName={member.firstName}
                        lastName={member.lastName}
                        className={classNames('p-2 rounded', {
                            'bg-secondary': i % 2 === 0,
                        })}
                    />
                ))}
            </ul>
        </div>
    );
}
