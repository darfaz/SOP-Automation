type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context) {
      formattedMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    return formattedMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const formattedMessage = this.formatMessage(level, message, context);
    console.log(formattedMessage);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();