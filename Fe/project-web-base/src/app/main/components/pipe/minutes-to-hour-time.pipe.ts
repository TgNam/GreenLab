import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'minutesToHourTime'
})
export class MinutesToHourTimePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || isNaN(value) || value < 0) return '';

    const totalMinutes = Math.floor(value);
    
    // Tính số giờ (mod 24 để đảm bảo trong phạm vi 1 ngày)
    const hours = Math.floor(totalMinutes / 60) % 24;
    
    // Tính số phút còn lại
    const minutes = totalMinutes % 60;

    // Format: HH:mm
    const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
    
    return `${pad(hours)}:${pad(minutes)}`;
  }
}