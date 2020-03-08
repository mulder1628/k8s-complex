import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// APp tries to render out Fib, Fib is trying to contact Express server
// Express is not running in this point
// in Real world:
//  we would mock out an api to return quickly w/o contacting express
test('renders learn react link', () => {
  // const { getByText } = render(<App />);
  // const linkElement = getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});
