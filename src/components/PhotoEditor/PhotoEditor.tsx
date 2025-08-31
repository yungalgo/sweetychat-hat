import React, { useState, useRef, useCallback, useEffect } from 'react';
// Hat images
import rightImage from '../../assets/right.png';
import leftImage from '../../assets/left.png';
import sweetychatLogo from '../../assets/horizontal-logo.svg';
import { Position, Transform } from './types';

export const PhotoEditor: React.FC = () => {
    const [baseImage, setBaseImage] = useState<string>('');
    const [currentHatImage, setCurrentHatImage] = useState<string>(rightImage);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [transform, setTransform] = useState<Transform>({
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: 1,
        flipX: false,
    });
    const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [status, setStatus] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStart = useRef<Position>({ x: 0, y: 0 });
    const statusTimeoutRef = useRef<NodeJS.Timeout>();


    const handleBaseImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showStatus('Please select an image file', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setOriginalImageSize({ width: img.width, height: img.height });
                    showStatus('Image loaded successfully', 'success');
                };
                const dataUrl = e.target?.result as string;
                img.src = dataUrl;
                setBaseImage(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const showStatus = useCallback((message: string, type: 'error' | 'success') => {
        if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
        }

        setStatus({ message, type });

        statusTimeoutRef.current = setTimeout(() => {
            setStatus(null);
        }, 1000);
    }, []);

    useEffect(() => {
        return () => {
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
        };
    }, []);


    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            isDragging.current = true;
            const touch = e.touches[0];
            dragStart.current = {
                x: touch.clientX - transform.position.x,
                y: touch.clientY - transform.position.y,
            };
        }
    }, [transform.position]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (isDragging.current && e.touches.length === 1) {
            const touch = e.touches[0];
            setTransform(prev => ({
                ...prev,
                position: {
                    x: touch.clientX - dragStart.current.x,
                    y: touch.clientY - dragStart.current.y,
                },
            }));
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        isDragging.current = false;
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - transform.position.x,
            y: e.clientY - transform.position.y,
        };
    }, [transform.position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging.current) {
            setTransform(prev => ({
                ...prev,
                position: {
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y,
                },
            }));
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    const handleRotate = useCallback((direction: 'left' | 'right') => {
        setTransform(prev => ({
            ...prev,
            rotation: prev.rotation + (direction === 'left' ? -15 : 15),
        }));
    }, []);

    const handleScale = useCallback((direction: 'up' | 'down') => {
        setTransform(prev => ({
            ...prev,
            scale: Math.max(0.1, Math.min(7, prev.scale * (direction === 'up' ? 1.1 : 0.9))),
        }));
    }, []);

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => {
            const newFlipped = !prev;
            setCurrentHatImage(newFlipped ? leftImage : rightImage);
            return newFlipped;
        });
    }, []);

    const handleReset = useCallback(() => {
        setTransform({
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: 1,
            flipX: false,
        });
        setIsFlipped(false);
        setCurrentHatImage(rightImage);
    }, []);

    const handleSave = useCallback(async () => {
        if (!baseImage || !overlayRef.current || !containerRef.current) {
            showStatus('Please upload an image first', 'error');
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            const baseImg = new Image();
            baseImg.src = baseImage;
            await new Promise(resolve => baseImg.onload = resolve);

            canvas.width = originalImageSize.width;
            canvas.height = originalImageSize.height;

            ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const containerAspect = containerRect.width / containerRect.height;
            const imageAspect = canvas.width / canvas.height;

            let displayedWidth = containerRect.width;
            let displayedHeight = containerRect.height;
            if (containerAspect > imageAspect) {
                displayedWidth = displayedHeight * imageAspect;
            } else {
                displayedHeight = displayedWidth / imageAspect;
            }

            const scaleX = canvas.width / displayedWidth;
            const scaleY = canvas.height / displayedHeight;

            const overlayImg = overlayRef.current.querySelector('img');
            if (overlayImg) {
                const hatImg = new Image();
                hatImg.src = currentHatImage;
                await new Promise(resolve => hatImg.onload = resolve);

                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;

                ctx.save();
                ctx.translate(centerX + (transform.position.x * scaleX), centerY + (transform.position.y * scaleY));
                ctx.rotate((transform.rotation * Math.PI) / 180);
                if (transform.flipX) {
                    ctx.scale(-1, 1);
                }
                ctx.scale(transform.scale, transform.scale);

                const overlayWidth = 400 * scaleX;
                const overlayHeight = (overlayWidth * hatImg.height) / hatImg.width;
                ctx.drawImage(hatImg, -overlayWidth / 2, -overlayHeight / 2, overlayWidth, overlayHeight);

                ctx.restore();
            }

            const link = document.createElement('a');
            link.download = 'sweetychat-hat.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            showStatus('Image saved successfully', 'success');
        } catch (error) {
            console.error('Save error:', error);
            showStatus('Error saving image', 'error');
        }
    }, [baseImage, transform, originalImageSize]);

    const getOverlayStyle = () => {
        return {
            transform: `translate(-50%, -50%) 
                       translate(${transform.position.x}px, ${transform.position.y}px)
                       rotate(${transform.rotation}deg)
                       scale(${transform.scale * (transform.flipX ? -1 : 1)}, ${transform.scale})`,
        };
    };

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-screen bg-[#0b35f1] text-white overflow-hidden">
            <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-20">
                <img 
                    src={sweetychatLogo} 
                    alt="Sweetychat Logo" 
                    className="h-10 lg:h-16 w-auto"
                />
            </div>
            
            {/* Mobile: Bottom Panel, Desktop: Left Panel - Controls */}
            <div className="order-2 lg:order-1 w-full lg:w-1/3 flex flex-col gap-2 lg:gap-6 p-4 lg:p-8 pt-4 lg:pt-32 overflow-y-auto flex-1 lg:flex-none lg:h-auto">
                <div className="text-center lg:text-left">
                    <h1 className="text-white text-xl lg:text-3xl tracking-wider font-neue-haas-display font-thin">
                        Put on your Sweetychat hat
                    </h1>
                </div>

                <div className="w-full">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBaseImageUpload}
                        className="w-full p-3 border-2 border-white rounded-lg bg-white/10 text-white cursor-pointer font-neue-haas-text font-normal transition-all hover:border-white hover:bg-white/20"
                    />
                </div>



                <div className="flex flex-col gap-2 lg:gap-3">
                    {/* Rotate buttons */}
                    <div className="flex gap-2 lg:gap-3">
                        <button
                            onClick={() => handleRotate('left')}
                            className="flex-1 px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            ⟲ Rotate left
                        </button>
                        <button
                            onClick={() => handleRotate('right')}
                            className="flex-1 px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            ⟳ Rotate right
                        </button>
                    </div>
                    
                    {/* Scale buttons */}
                    <div className="flex gap-2 lg:gap-3">
                        <button
                            onClick={() => handleScale('up')}
                            className="flex-1 px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            ⊕ Scale up
                        </button>
                        <button
                            onClick={() => handleScale('down')}
                            className="flex-1 px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            ⊖ Scale down
                        </button>
                    </div>
                    
                    {/* Flip button */}
                    <div className="flex gap-2 lg:gap-3">
                        <button
                            onClick={handleFlip}
                            className="w-full px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            ↔️ Flip
                        </button>
                    </div>
                    
                    {/* Reset and Save buttons */}
                    <div className="flex gap-2 lg:gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!baseImage}
                            className="flex-1 px-3 py-2 lg:px-4 lg:py-3 rounded-lg bg-white text-[#0b35f1] cursor-pointer text-sm lg:text-base font-neue-haas-text font-normal tracking-wider transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            Save image
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: Top Panel, Desktop: Right Panel - Canvas */}
            <div className="order-1 lg:order-2 w-full lg:w-2/3 flex items-center justify-center p-4 lg:p-8 flex-1 lg:flex-none lg:h-auto pt-16 lg:pt-8">
                <div
                    ref={containerRef}
                    className="relative w-full aspect-square lg:h-[80vh] lg:max-h-[800px] max-w-[400px] lg:max-w-none lg:w-full border-2 lg:border-3 border-white rounded-xl overflow-hidden touch-none bg-[#2a2a2a] shadow-lg"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                >
                    {baseImage && (
                        <img src={baseImage} alt="Base" className="w-full h-full object-contain" />
                    )}

                    <div
                        ref={overlayRef}
                        style={getOverlayStyle()}
                        className="absolute top-1/2 left-1/2 cursor-move touch-none filter drop-shadow-lg"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <img
                            src={currentHatImage}
                            alt="Overlay"
                            className="w-[400px] h-auto select-none"
                            draggable={false}
                        />
                    </div>
                </div>
            </div>

            {status && (
                <div
                    className={`fixed bottom-20 right-8 px-6 py-3 rounded-lg 
                    ${status.type === 'error' ? 'bg-red-500' : 'bg-green-600'}
                    text-white font-medium shadow-lg
                    transition-opacity duration-300
                    opacity-90 animate-fade-out`}
                >
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default PhotoEditor;