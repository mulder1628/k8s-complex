import React from 'react';
import {Link} from 'react-router-dom';

export default () => {
    return (
        <div>
        I am on other page!
        <Link to="/">Go Home!</Link>
        </div>
    );
};