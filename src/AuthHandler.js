import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup2 from './PopUp2';

function AuthHandler() {
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [timeoutHandle, setTimeoutHandle] = useState(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('userToken');
        clearTimeout(timeoutHandle);
        setShowPopup(false);
        navigate('/login');
    }, [navigate, timeoutHandle]);

    const renewToken = useCallback((token) => {
        fetch('http://127.0.0.1:8000/refresh_token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('userToken', data.token);
                console.log('Tu sesión ha sido renovada.');
                clearTimeout(timeoutHandle);
                setShowPopup(false);
            } else {
                console.log('No se pudo renovar la sesión. Vuelve a iniciar sesión.');
                handleLogout();
            }
        })
        .catch(() => {
            console.error('Error renovando el token.');
            handleLogout();
        });
    }, [handleLogout, timeoutHandle]);

    useEffect(() => {
        const checkTokenExpiration = () => {
            const token = localStorage.getItem('userToken');
            const payload = token && JSON.parse(atob(token.split('.')[1]));
            const exp = payload?.exp;
            const now = Date.now() / 1000;

            if (exp - now < 60 && exp - now > 0) {
                setShowPopup(true);
                setPopupMessage('Tu sesión está a punto de expirar. ¿Deseas continuar navegando?');
                const handle = setTimeout(handleLogout, 60000); 
                setTimeoutHandle(handle);
            } else if (exp - now <= 0) {
                handleLogout();
            }
        };

        const intervalId = setInterval(checkTokenExpiration, 60000); 

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutHandle);
        };
    }, [handleLogout, renewToken, timeoutHandle]);

    const handleRenewSession = () => {
        const token = localStorage.getItem('userToken');
        renewToken(token);
        clearTimeout(timeoutHandle);
        setShowPopup(false);
    };

    return showPopup && (
        <Popup2 
            title="¿Sigues ahí?"
            message={popupMessage}
            onConfirm={handleRenewSession}
            onCancel={handleLogout}
        />
    );
}

export default AuthHandler;