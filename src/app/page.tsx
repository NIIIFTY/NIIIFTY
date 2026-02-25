import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { title, description } from '../utils/Config';

export const metadata: Metadata = {
  title,
  description,
};

export default function Home() {
  return <HomeClient />;
}
