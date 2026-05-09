import {createContext, useContext, useEffect, useState} from 'react';
import {io} from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if(!token) return ; //don't connect if not logged in

        //create the socket connection
        //auth.token is how we pass jwt during the websocket handshake
        // http headers don't work for websockets, this is the standard way

        const newSocket = io('http://localhost:5000',{
            auth: {token}
        });

        //built-in socket.io events
        newSocket.on('connect' , () => {
            console.log('socket connected', newSocket.id);
            setIsConnected(true);
        });
        newSocket.on('disconnect', () => {
            console.log('socket disconnected');
            setIsConnected(false);
        });
        newSocket.on('connect error', (err) => {
            console.log('connection failed', err.message);
        });
        setSocket(newSocket);

        //cleanup: disconnect when component unmounts
        return () => newSocket.disconnect();

    }, []);
    return (
        <SocketContext.Provider value = {{ socket, isConnected}}>
            {children}
        </SocketContext.Provider>
    );
};

//custom hook so any component can access the socket in one line
export const useSocket = () => useContext(SocketContext);