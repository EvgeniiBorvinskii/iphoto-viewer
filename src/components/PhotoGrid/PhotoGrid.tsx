import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import './PhotoGrid.css';

interface Photo {
  id: string;
  filename: string;
  dateCreated: Date;
  thumbnail?: string;
}

const PhotoGrid: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [draggedPhotos, setDraggedPhotos] = useState<string[]>([]);
  const [isReloading, setIsReloading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });

  const COLUMN_COUNT = 5;
  const ITEM_SIZE = 220;
  const GAP = 16;

  useEffect(() => {
    loadPhotos();
    
    const updateDimensions = () => {
      if (gridRef.current) {
        setGridDimensions({
          width: gridRef.current.clientWidth,
          height: gridRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    setIsReloading(true);
    try {
      console.log('🔄 Loading photos...');
      const result = await window.electron.getPhotos(0, 500);
      console.log(`✓ Got ${result.photos.length} photos, total: ${result.total}`);
      
      const photosWithThumbnails = await Promise.all(
        result.photos.map(async (photo: Photo) => {
          const thumbnail = await window.electron.getPhotoThumbnail(photo.id);
          return { ...photo, thumbnail };
        })
      );
      setPhotos(photosWithThumbnails);
      console.log(`✓ Loaded ${photosWithThumbnails.length} photos`);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
      setIsReloading(false);
    }
  };

  const handleReload = async () => {
    console.log('🔄 Reload button clicked');
    await loadPhotos();
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    const photosToTransfer = selectedPhotos.has(photoId)
      ? Array.from(selectedPhotos)
      : [photoId];
    
    setDraggedPhotos(photosToTransfer);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(photosToTransfer));
  };

  const handleDragEnd = () => {
    setDraggedPhotos([]);
  };

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex;
    if (index >= photos.length) return null;

    const photo = photos[index];
    const isSelected = selectedPhotos.has(photo.id);
    const isDragging = draggedPhotos.includes(photo.id);

    return (
      <div
        style={{
          ...style,
          left: Number(style.left) + GAP / 2,
          top: Number(style.top) + GAP / 2,
          width: Number(style.width) - GAP,
          height: Number(style.height) - GAP,
        }}
      >
        <motion.div
          className={`photo-item glass ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
          onClick={() => togglePhotoSelection(photo.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, photo.id)}
          onDragEnd={handleDragEnd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.01 }}
        >
          {photo.thumbnail ? (
            <img src={photo.thumbnail} alt={photo.filename} className="photo-thumbnail" />
          ) : (
            <div className="photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
          
          {isSelected && (
            <motion.div
              className="selection-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          )}
          
          <div className="photo-overlay">
            <span className="photo-name">{photo.filename}</span>
          </div>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="photo-grid-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
        <p>Loading photos...</p>
      </div>
    );
  }

  return (
    <div className="photo-grid-container" ref={gridRef}>
      <div className="photo-grid-header glass">
        <div className="header-info">
          <h2>Photos</h2>
          <span className="photo-count">
            {selectedPhotos.size > 0
              ? `${selectedPhotos.size} selected of ${photos.length}`
              : `${photos.length} photos`}
          </span>
        </div>

        <motion.button
          className="reload-button"
          onClick={handleReload}
          disabled={isReloading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ marginLeft: '12px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          {isReloading ? 'Reloading...' : 'Reload'}
        </motion.button>
        
        {selectedPhotos.size > 0 && (
          <motion.div
            className="header-actions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <motion.button
              className="action-button"
              onClick={() => setSelectedPhotos(new Set())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Selection
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="photo-grid-content">
        {gridDimensions.width > 0 && (
          <Grid
            columnCount={COLUMN_COUNT}
            columnWidth={ITEM_SIZE}
            height={gridDimensions.height - 80}
            rowCount={Math.ceil(photos.length / COLUMN_COUNT)}
            rowHeight={ITEM_SIZE}
            width={gridDimensions.width}
            className="photo-grid"
          >
            {Cell}
          </Grid>
        )}
      </div>

      <AnimatePresence>
        {draggedPhotos.length > 0 && (
          <motion.div
            className="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="drag-info glass">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Drag {draggedPhotos.length} photo{draggedPhotos.length > 1 ? 's' : ''} to transfer</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoGrid;
