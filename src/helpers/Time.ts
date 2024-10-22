/**
 * Converts a Unix timestamp in seconds (with fractional milliseconds) to a formatted date string in MM-DD-YYYY format using Intl.DateTimeFormat.
 *
 * @param timestampInSeconds - The Unix timestamp in seconds (can include fractional milliseconds).
 * @returns The formatted date string in MM-DD-YYYY format.
 * @throws Will throw an error if the timestamp is invalid.
 */
export function formatTimestampWithIntl(timestampInSeconds: number): string {
    if (typeof timestampInSeconds !== 'number' || isNaN(timestampInSeconds)) {
        throw new Error('Invalid timestamp: timestamp must be a valid number.');
    }

    // Convert seconds to milliseconds
    const timestampInMilliseconds = timestampInSeconds * 1000;

    // Create a Date object
    const date = new Date(timestampInMilliseconds);

    // Check if the Date object is valid
    if (isNaN(date.getTime())) {
        throw new Error('Invalid timestamp: unable to create a valid Date object.');
    }

    // Use Intl.DateTimeFormat for formatting
    const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC', // Adjust as needed
    });

    const formatted = formatter.format(date);

    // Replace slashes with hyphens if necessary
    return formatted.replace(/\//g, '-');
}
