import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error

  // 1. Handle file selection & local preview
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file)); // Create a temporary URL for the <img> tag
      setStatus('idle');
    }
  };

  // 2. The Axios Request
  const onUpload = async () => {
    if (!selectedFile) return alert("Please select a file first!");

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('userId', '1'); // Example ID for your MySQL 'users' table

    setStatus('uploading');

    try {
      // REPLACE with your Master/Worker EC2 Public IP + NodePort
      const API_URL = "http://snapscale-producer-service:80/upload";
      
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Server Response:", response.data);
      setStatus('success');
    } catch (err) {
      console.error("Upload error:", err);
      setStatus('error');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Upload to SnapScale</h2>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        id="file-input" 
        accept="image/*" 
        onChange={onFileChange} 
        style={{ display: 'none' }}
      />

      {/* Custom UI for Input */}
      <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block', border: '2px dashed #ccc', padding: '40px', borderRadius: '10px' }}>
        {preview ? (
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '5px' }} />
        ) : (
          <div>
            <ImageIcon size={48} color="#aaa" />
            <p>Click to select an image</p>
          </div>
        )}
      </label>

      {/* Action Button */}
      <button 
        onClick={onUpload} 
        disabled={!selectedFile || status === 'uploading'}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: status === 'uploading' ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {status === 'uploading' ? 'Processing...' : 'Upload to S3'}
      </button>

      {/* Status Messages */}
      <div style={{ marginTop: '15px' }}>
        {status === 'success' && <p style={{ color: 'green' }}><CheckCircle size={16}/> Queued in RabbitMQ!</p>}
        {status === 'error' && <p style={{ color: 'red' }}><AlertCircle size={16}/> Upload failed.</p>}
      </div>
    </div>
  );
};

export default ImageUpload;