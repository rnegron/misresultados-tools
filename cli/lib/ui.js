import ora from 'ora';
import pc from 'picocolors';

let spinner = null;

export function createSpinner(text) {
  spinner = ora({
    text,
    spinner: 'dots',
    color: 'blue'
  });
  
  return spinner;
}

export function stopAllSpinners() {
  if (spinner && spinner.isSpinning) {
    spinner.stop();
    spinner = null;
  }
}

// Graceful shutdown handling
export function setupGracefulShutdown() {
  const cleanup = () => {
    stopAllSpinners();
    console.log('\n' + pc.yellow('🛑 Operación cancelada por el usuario'));
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}