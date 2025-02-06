import { AVAILABLE_COMMANDS } from './commandRouter';

export const helpCommands = {
  HELP: (type) => {
    if (!type) {
      return `
STOCKBOX TERMINAL HELP
=====================

Global Commands:
---------------
SYMBOL <ticker>  Set active symbol (e.g., SYMBOL AAPL)
HELP [type]      Show commands (e.g., HELP STOCK)
CLEAR/CLS        Clear terminal output

Security Types:
-------------
${Object.keys(AVAILABLE_COMMANDS).join(', ')}

Type HELP <security type> for specific commands`;
    }

    const commands = AVAILABLE_COMMANDS[type];
    if (!commands) {
      return `Unknown security type: ${type}`;
    }

    return `
Available commands for ${type}:
${commands.join('\n')}`;
  }
}; 