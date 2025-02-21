type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  info(message: string) {
    this.log('info', message);
  }

  warn(message: string) {
    this.log('warn', message);
  }

  error(message: string) {
    this.log('error', message);
  }
}

export const logger = new Logger();
