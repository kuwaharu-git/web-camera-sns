import { useState, useRef, useEffect } from 'react'
import './App.css'

const HASHTAG = '#WebCameraSNS'; // アプリ側で指定するハッシュタグ

function App() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // カメラの起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // スマートフォンの背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('カメラへのアクセスに失敗しました。カメラの使用を許可してください。');
      console.error('Camera error:', err);
    }
  };

  // カメラの停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // シャッターボタンで写真を撮影
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/png');
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  // 写真を再撮影
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // X(Twitter)に投稿
  const postToTwitter = () => {
    if (!capturedImage) return;

    // Twitter Web Intent URLを使用してツイート作成画面を開く
    // ハッシュタグを含むテキストを設定
    const tweetText = encodeURIComponent(HASHTAG);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    
    // 新しいウィンドウでTwitterを開く
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    
    // 注意: 画像の直接アップロードはTwitter Web Intent APIではサポートされていません
    // ユーザーは画面をスクリーンショットするか、画像を手動でアップロードする必要があります
    alert('写真をスクリーンショットまたはダウンロードして、Twitterの投稿に添付してください。');
  };

  // 写真をダウンロード
  const downloadPhoto = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `photo-${Date.now()}.png`;
    link.click();
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="app">
      <h1>📷 Web Camera SNS</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isCameraActive && !capturedImage && (
        <div className="start-screen">
          <button onClick={startCamera} className="start-button">
            カメラを起動
          </button>
        </div>
      )}

      {isCameraActive && !capturedImage && (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-feed"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="controls">
            <button onClick={capturePhoto} className="shutter-button">
              📸 シャッター
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="preview-view">
          <img src={capturedImage} alt="Captured" className="captured-image" />
          <div className="preview-controls">
            <button onClick={retakePhoto} className="retake-button">
              🔄 撮り直す
            </button>
            <button onClick={downloadPhoto} className="download-button">
              💾 ダウンロード
            </button>
            <button onClick={postToTwitter} className="post-button">
              🐦 X(Twitter)に投稿
            </button>
          </div>
          <p className="hashtag-info">ハッシュタグ: {HASHTAG}</p>
        </div>
      )}
    </div>
  );
}

export default App
