class VideoProcessor:
    def __init__(self):
        pass

    def process(self, video_path: str):
        # Burada video işleme kodunu yazabilirsiniz
        print(f"Processing video: {video_path}")
        return {
            "status": "success",
            "message": f"Video {video_path} processed."
        } 