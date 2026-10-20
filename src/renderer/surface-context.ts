import {createContext} from 'react';
/** Changing the native modal parent invalidates embedded browsing contexts in Chromium. */
export const SurfaceEpochContext=createContext(0);
