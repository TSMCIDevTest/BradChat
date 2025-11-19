// setting up audio
const keyStrokeSounds = [
    new Audio('/sounds/keystroke1.mp3'),
    new Audio('/sounds/keystroke2.mp3'),
    new Audio('/sounds/keystroke3.mp3'),
    new Audio('/sounds/keystroke4.mp3'),
];

function useKeyboardSound() {
    const playRandomKeystrokeSound = () => {
        const randomSound = keyStrokeSounds[Math.floor(Math.random() * keyStrokeSounds.length)];

        randomSound.currentTime = 0; // Reset to start
        randomSound.play().catch(error => console.log('Error playing sound:', error)
        )
    }

    return { playRandomKeystrokeSound };
}

export default useKeyboardSound;