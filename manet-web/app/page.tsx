import MorseRadio from '@/components/MorseRadio';
import MorseDecoder from '@/components/MorseDecoder';

export default function Home() {
  return (
    <main className="container">
      <header>
        <h1>MANET Morse Radio</h1>
        <p className="tagline">
          Type a message and send it as radio signals (Morse code)
        </p>
      </header>
      <MorseRadio />
      <MorseDecoder />
    </main>
  );
}
