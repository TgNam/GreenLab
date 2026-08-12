import { NgModule } from "@angular/core";
import { MinutesToTimePipe } from "./minutes-to-time.pipe";
import { OssThumbnailPipe } from "./oss-thumbnail.pipe";
import { TranslatePipe } from "./translate.pipe";
import { MinutesToHourTimePipe } from "./minutes-to-hour-time.pipe";
import { SafeHtmlPipe } from "./safe-html.pipe";

@NgModule({
  declarations: [TranslatePipe, MinutesToTimePipe, OssThumbnailPipe, MinutesToHourTimePipe, SafeHtmlPipe],
  exports: [TranslatePipe, MinutesToTimePipe, OssThumbnailPipe, MinutesToHourTimePipe, SafeHtmlPipe]
})
export class SharedPipesModule {}
