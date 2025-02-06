// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
dotenv.config();

window.ENV = {
  FINNHUB_API_KEY: process.env.REACT_APP_FINNHUB_API_KEY
};
