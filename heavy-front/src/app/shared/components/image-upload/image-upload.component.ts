
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-image-upload',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './image-upload.component.html'
})
export class ImageUploadComponent implements OnChanges {
    @Input() label: string = '';
    @Input() icon: string = '';
    @Input() currentImage: string | null = null;
    @Input() accept: string = 'image/*';
    @Input() height: string = '18rem'; // h-72 equivalent

    @Output() fileSelected = new EventEmitter<File>();

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    previewUrl: string | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentImage'] && this.currentImage) {
            this.previewUrl = this.currentImage;
        }
    }

    triggerFileInput(): void {
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.processFile(input.files[0]);
        }
    }

    onFileDropped(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
            this.processFile(event.dataTransfer.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    private processFile(file: File): void {
        const reader = new FileReader();
        reader.onload = () => {
            this.previewUrl = reader.result as string;
            this.fileSelected.emit(file);
        };
        reader.readAsDataURL(file);
    }
}
