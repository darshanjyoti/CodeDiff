import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import * as Diff from 'diff';
import 'diff2html'; // Import the entire library for direct usage

@Component({
  selector: 'app-diff-viewer',
  templateUrl: './diff-viewer.component.html',
  styleUrls: ['./diff-viewer.component.css']
})
export class DiffViewerComponent {
  leftCode: string = '';
  rightCode: string = '';
  diffHtml: string = '';
  linesAdded: number = 0;
  linesRemoved: number = 0;
  unchangedLines: number = 0;
  leftFileSize: string = '';
  rightFileSize: string = '';
  mode : string = 'Dark';
  isDarkMode: boolean = false;
  show : boolean = false;
  showLineNumbers: boolean = false;
  fullview : boolean = true;
  enableDownload : boolean = false;

  constructor(private renderer: Renderer2) {}

 
  onSingleView(): void{
    this.fullview = true;
    this.compareFiles();
  }
  
  onSideView(): void {
    this.fullview = false;
    this.compareFiles();
   }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if(this.mode == 'Dark'){
      this.mode = 'Light';
    }
    else{
      this.mode = 'Dark';
    }
    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark-mode');
      this.renderer.addClass(document.querySelector('.container'), 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
      this.renderer.removeClass(document.querySelector('.container'), 'dark-mode');
    }
  }

  onFileChange(event: any, side: 'left' | 'right'): void {
    const file = event.target.files[0];
    if (file) {
      if (!this.isValidFileType(file)) {
        alert('Uploaded file is not supported');
        return;
      }
      const fileSize = this.getFileSizeString(file.size);
      // File size validation (example: accept files up to 5MB)
      const maxSize = 3 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size exceeds the limit of 3MB. Please upload a smaller file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        if (side === 'left') {
          this.leftCode = content;
          this.leftFileSize = fileSize;
        } else {
          this.rightCode = content;
          this.rightFileSize = fileSize;
        }
      };
      reader.readAsText(file);
    }
    
  }

  compareFiles(): void {
    if (!this.leftCode || !this.rightCode) {
      alert('Please upload both files to compare.');
      return;
    }
    const diff = Diff.createTwoFilesPatch('File1', 'File2', this.leftCode, this.rightCode);
    const diffJson = Diff.parsePatch(diff);
    if (!diffJson) {
      alert('Failed to parse diff data.');
      return;
    }

    // Reset counts
    this.linesAdded = 0;
    this.linesRemoved = 0;
    this.unchangedLines = 0;

    // Count lines
    diffJson.forEach((part: any) => {
      part.hunks.forEach((hunk: any) => {
        hunk.lines.forEach((line: any) => {
          if (line.charAt(0) === '+') {
            this.linesAdded++;
          } else if (line.charAt(0) === '-') {
            this.linesRemoved++;
          } else {
            this.unchangedLines++;
          }
        });
      });
    });
    // Generate HTML diff view
    this.renderDiff(diff);
  }


  renderDiff(diff: string): void {
    if(this.fullview){
    this.diffHtml = (window as any).Diff2Html.html(diff, { drawFileList: false, matching: 'lines' });
    }
    else{
    this.diffHtml = (window as any).Diff2Html.html(diff, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side', // Example: Render as side-by-side
      showFiles: false,
      showLineNumbers: this.showLineNumbers // Toggle line numbers based on user action
    });
  }
   //now enable download
   this.enableDownload = true;
  }

  isValidFileType(file: File): boolean {
    const validTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'application/javascript',
      'text/x-c++src',
      'text/x-c',
      'text/x-java-source',
      'text/x-python',
      'text/x-ruby',
      'text/x-swift',
      'text/x-php',
      'text/x-go',
      'text/x-rust',
      'text/x-typescript'
      // Add more types as needed
    ];
    return validTypes.includes(file.type);
  }


  getFileSizeString(sizeInBytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  downloadDiff(format: 'html' | 'text'): void {
     // Remove the first two lines from diffHtml
    const modifiedHtml = this.diffHtml.split('\n').slice(2).join('\n');
    const blob = new Blob([modifiedHtml], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
}
}
