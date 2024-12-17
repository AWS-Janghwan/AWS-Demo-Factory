import tkinter as tk
from tkinter import filedialog, ttk
import subprocess
import os
import threading

class VideoCompressorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("비디오 압축 도구")
        self.root.geometry("600x500")
        
        # 입력 파일 선택
        self.create_input_section()
        
        # 출력 경로 선택
        self.create_output_section()
        
        # 해상도 선택
        self.create_resolution_section()
        
        # 품질 설정
        self.create_quality_section()
        
        # 진행 상태
        self.create_progress_section()
        
        # 압축 시작 버튼
        tk.Button(root, text="압축 시작", command=self.start_compression).pack(pady=10)

    def create_input_section(self):
        input_frame = tk.LabelFrame(self.root, text="입력 파일", padx=5, pady=5)
        input_frame.pack(fill="x", padx=5, pady=5)
        
        self.input_path = tk.Entry(input_frame)
        self.input_path.pack(side=tk.LEFT, fill="x", expand=True)
        
        tk.Button(input_frame, text="찾아보기", command=self.browse_input).pack(side=tk.RIGHT)

    def create_output_section(self):
        output_frame = tk.LabelFrame(self.root, text="출력 경로", padx=5, pady=5)
        output_frame.pack(fill="x", padx=5, pady=5)
        
        self.output_path = tk.Entry(output_frame)
        self.output_path.pack(side=tk.LEFT, fill="x", expand=True)
        
        tk.Button(output_frame, text="찾아보기", command=self.browse_output).pack(side=tk.RIGHT)

    def create_resolution_section(self):
        resolution_frame = tk.LabelFrame(self.root, text="출력 해상도", padx=5, pady=5)
        resolution_frame.pack(fill="x", padx=5, pady=5)
        
        self.resolution = ttk.Combobox(resolution_frame, 
            values=["원본 해상도", "FHD (1920x1080)", "2K (2560x1440)", "4K (3840x2160)"])
        self.resolution.set("원본 해상도")
        self.resolution.pack(fill="x")

    def create_quality_section(self):
        quality_frame = tk.LabelFrame(self.root, text="압축 품질", padx=5, pady=5)
        quality_frame.pack(fill="x", padx=5, pady=5)
        
        self.quality = tk.Scale(quality_frame, from_=0, to=51, orient=tk.HORIZONTAL,
                              label="CRF 값 (낮을수록 품질 좋음)")
        self.quality.set(23)
        self.quality.pack(fill="x")

    def create_progress_section(self):
        progress_frame = tk.LabelFrame(self.root, text="진행 상태", padx=5, pady=5)
        progress_frame.pack(fill="x", padx=5, pady=5)
        
        self.progress = ttk.Progressbar(progress_frame, length=400, mode='determinate')
        self.progress.pack(pady=5)
        
        self.status_label = tk.Label(progress_frame, text="")
        self.status_label.pack()

    def browse_input(self):
        filename = filedialog.askopenfilename(filetypes=[("MP4 files", "*.mp4")])
        self.input_path.delete(0, tk.END)
        self.input_path.insert(0, filename)

    def browse_output(self):
        directory = filedialog.askdirectory()
        self.output_path.delete(0, tk.END)
        self.output_path.insert(0, directory)

    def get_resolution_params(self):
        resolution_map = {
            "FHD (1920x1080)": "1920:1080",
            "2K (2560x1440)": "2560:1440",
            "4K (3840x2160)": "3840:2160"
        }
        selected = self.resolution.get()
        return resolution_map.get(selected, "")

    def start_compression(self):
        if not self.input_path.get() or not self.output_path.get():
            self.status_label.config(text="입력 파일과 출력 경로를 선택해주세요.")
            return
            
        threading.Thread(target=self.compress_video, daemon=True).start()

    def compress_video(self):
        input_file = self.input_path.get()
        output_dir = self.output_path.get()
        output_file = os.path.join(output_dir, f"compressed_{os.path.basename(input_file)}")
        
        # FFmpeg 명령어 구성
        cmd = ['ffmpeg', '-i', input_file]
        
        # 해상도 설정
        resolution = self.get_resolution_params()
        if resolution:
            cmd.extend(['-vf', f'scale={resolution}'])
        
        # 품질 설정
        cmd.extend([
            '-c:v', 'libx264',
            '-crf', str(self.quality.get()),
            '-preset', 'medium',
            '-c:a', 'aac',
            output_file
        ])

        try:
            self.status_label.config(text="압축 중...")
            self.progress['value'] = 0
            
            process = subprocess.Popen(cmd, stderr=subprocess.PIPE, universal_newlines=True)
            
            while True:
                line = process.stderr.readline()
                if not line and process.poll() is not None:
                    break
                    
                if "time=" in line:
                    # 진행률 업데이트
                    self.progress['value'] += 1
                    if self.progress['value'] >= 100:
                        self.progress['value'] = 0
                    self.root.update()
            
            self.status_label.config(text="압축 완료!")
            self.progress['value'] = 100
            
        except Exception as e:
            self.status_label.config(text=f"오류 발생: {str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = VideoCompressorGUI(root)
    root.mainloop()
