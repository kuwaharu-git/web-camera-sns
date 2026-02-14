import { useState, useRef, useEffect } from 'react'
import './App.css'
import { FaCamera, FaVideo, FaRedo, FaShareAlt, FaStop } from 'react-icons/fa'

const HASHTAG = '#LiveFx'; // アプリ側で指定するハッシュタグ

function App() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // カメラの起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // スマートフォンの背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }

    return '';
  };

  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    recordedChunksRef.current = [];

    const mimeType = getSupportedMimeType();
    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const finalType = mimeType || 'video/webm';
      const blob = new Blob(recordedChunksRef.current, { type: finalType });
      const url = URL.createObjectURL(blob);
      setRecordedVideoBlob(blob);
      setRecordedVideoUrl(url);
      recordedChunksRef.current = [];
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    stopCamera();
  };

  // 動画を再撮影
  const retakeVideo = () => {
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    startCamera();
  };

  const downloadVideo = () => {
    if (!recordedVideoBlob || !recordedVideoUrl) return;
    const link = document.createElement('a');
    link.href = recordedVideoUrl;
    link.download = `video-${Date.now()}.webm`;
    link.click();
    link.remove();
  };

  // X(Twitter)に投稿
  const postToTwitter = () => {
    if (!recordedVideoBlob) return;

    // Twitter Web Intent URLを使用してツイート作成画面を開く
    // ハッシュタグを含むテキストを設定
    const tweetText = encodeURIComponent(HASHTAG);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    
    // 新しいウィンドウでTwitterを開く
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    
    // 注意: 動画の直接アップロードはTwitter Web Intent APIではサポートされていません
    alert('動画を保存して、Xの投稿に手動で添付してください。');
  };

  // 共有シートからXへ投稿（対応端末のみ）
  const shareToX = async () => {
    if (!recordedVideoBlob) return;

    if (!window.isSecureContext || !navigator.share || !navigator.canShare) {
      postToTwitter();
      return;
    }

    const file = new File([recordedVideoBlob], `video-${Date.now()}.webm`, { type: recordedVideoBlob.type || 'video/webm' });

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
      const shareError = err as DOMException;
      if (shareError?.name === 'AbortError') {
        return;
      }
      if (shareError?.name === 'NotAllowedError') {
        alert('共有が許可されませんでした。端末の共有設定、HTTPS接続、ブラウザ対応を確認してください。');
        postToTwitter();
        return;
      }
      console.error('Share error:', err);
    }
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

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  return (
    <div className="app">
      <h1><FaCamera /> Web Camera SNS</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isCameraActive && !recordedVideoUrl && (
        <div className="start-screen">
          <button onClick={startCamera} className="start-button">
            <FaVideo /> カメラを起動
          </button>
        </div>
      )}

      {isCameraActive && !recordedVideoUrl && (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-feed"
          />
          <div className="controls">
            {!isRecording && (
              <button onClick={startRecording} className="shutter-button">
                <FaVideo /> 録画開始
              </button>
            )}
            {isRecording && (
              <button onClick={stopRecording} className="shutter-button">
                <FaStop /> 停止
              </button>
            )}
          </div>
        </div>
      )}

      {recordedVideoUrl && (
        <div className="preview-view">
          <video
            src={recordedVideoUrl}
            className="captured-video"
            controls
            playsInline
          />
          <div className="preview-controls">
            <button onClick={retakeVideo} className="retake-button">
              <FaRedo /> 撮り直す
            </button>
            <button onClick={downloadVideo} className="download-button">
              <FaVideo /> 保存
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
