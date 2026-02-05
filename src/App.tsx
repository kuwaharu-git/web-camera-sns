import { useState, useRef, useEffect } from 'react'
import './App.css'
import { FaCamera, FaVideo, FaRedo, FaDownload, FaTwitter, FaShareAlt } from 'react-icons/fa'

const HASHTAG = '#LiveFx'; // アプリ側で指定するハッシュタグ

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

      streamRef.current = stream;
      setIsCameraActive(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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

  // 共有シートからXへ投稿（対応端末のみ）
  const shareToX = async () => {
    if (!capturedImage) return;

    if (!navigator.share || !navigator.canShare) {
      postToTwitter();
      return;
    }

    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], `photo-${Date.now()}.png`, { type: 'image/png' });

    if (!navigator.canShare({ files: [file] })) {
      postToTwitter();
      return;
    }

    try {
      await navigator.share({
        text: HASHTAG,
        files: [file]
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // 写真をダウンロード
  const downloadPhoto = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `photo-${Date.now()}.png`;
    link.click();
  };

  // 保存してXに投稿
  const downloadAndPostToX = () => {
    if (!capturedImage) return;
    
    // 画像をダウンロード
    downloadPhoto();
    
    // ハッシュタグ付きのX投稿画面を開く
    const tweetText = encodeURIComponent(HASHTAG);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  return (
    <div className="app">
      <h1><FaCamera /> Web Camera SNS</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isCameraActive && !capturedImage && (
        <div className="start-screen">
          <button onClick={startCamera} className="start-button">
            <FaVideo /> カメラを起動
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
              <FaCamera /> 撮影
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="preview-view">
          <img src={capturedImage} alt="Captured" className="captured-image" />
          <div className="preview-controls">
            <button onClick={retakePhoto} className="retake-button">
              <FaRedo /> 撮り直す
            </button>
            <button onClick={downloadPhoto} className="download-button">
              <FaDownload /> 保存
            </button>
            <button onClick={downloadAndPostToX} className="post-button">
              <FaTwitter /> 保存してXに投稿
            </button>
            <button onClick={shareToX} className="post-button">
              <FaShareAlt /> 共有
            </button>
          </div>
          <p className="hashtag-info">ハッシュタグ: {HASHTAG}</p>
        </div>
      )}
    </div>
  );
}

export default App
