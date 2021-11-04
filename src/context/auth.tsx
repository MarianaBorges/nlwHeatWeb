import { useState } from "react";
import { createContext, ReactNode, useEffect } from "react";
import { api } from "../services/api";

export const AuthContext = createContext({} as AuthContextData);

type User = {
    id: string;
    name: string;
    login: string;
    avatar_url: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: ()=> void;
}

type AuthProvider = {
    children: ReactNode;
}

type AuthResponse = {
    token: string;
    user: {
        id: string;
        avatar_url: string;
        name: string;
        login: string;
    }
}
export function AuthProvider ({children}: AuthProvider){
    
    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=ac697baef25487195f34`;
    const [user, setUser] = useState<User|null>(null)
    
    async function signIn(githubCode:string){
        const response = await api.post<AuthResponse>('authenticate',{
            code: githubCode
        });

        const { token , user } = response.data;

        localStorage.setItem('@dowhile:token', token);

        api.defaults.headers.common.authorization = `Bearer ${token}`;

        setUser(user);
    }

    function signOut(){
        setUser(null);
        localStorage.removeItem('@dowhile:token');
    }

    useEffect(()=>{
        const token = localStorage.getItem('@dowhile:token');
        if(token){
            api.defaults.headers.common.authorization = `Bearer ${token}`;
            api.get('profile').then(response =>{
                setUser(response.data);
            })
        }
    },[]);
    
    useEffect(()=>{
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if (hasGithubCode){
            const [urlWithoutCode, githubCode] = url.split('?code=');
            window.history.pushState({},'',urlWithoutCode)
            signIn(githubCode);
        }
    },[]);
    return(
        <AuthContext.Provider value={{signInUrl, user, signOut}}>
            {children}
        </AuthContext.Provider>
    )
}