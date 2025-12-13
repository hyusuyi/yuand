import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

/**
 * 格式化秒数为天、小时、分钟、秒的字符串
 * @param seconds 秒数
 * @returns 格式化后的字符串
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return '0秒';

    const duration = dayjs.duration(seconds, 'seconds');

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const secs = duration.seconds();

    let result = '';

    if (days > 0) result += `${days}天`;
    if (hours > 0) result += `${hours}小时`;
    if (minutes > 0) result += `${minutes}分`;
    if (secs > 0) result += `${secs}秒`;

    return result || '0秒';
}