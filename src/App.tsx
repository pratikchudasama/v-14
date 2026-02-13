import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, MouseEvent } from 'react'
import './App.css'

type Photo = {
  id: string
  name: string
  url: string
}

type ConfettiPiece = {
  id: number
  x: number
  y: number
  rotation: number
  size: number
  color: string
  delay: number
  duration: number
  shape: 'rect' | 'circle'
}

type HeartPiece = {
  id: number
  left: number
  size: number
  delay: number
  duration: number
  drift: number
  hue: number
}

type CursorHeart = {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  hue: number
}

type UploadNotice =
  | { kind: 'all_failed' }
  | { kind: 'partial_failed'; names: string[] }

type ContentCopy = {
  brand: string
  uploadButton: string
  heroEyebrow: string
  heroTitle: string
  heroLead: string
  heroCta: string
  chapter1Label: string
  chapter1Heading: string
  chapter1Text: string
  chapter2Label: string
  chapter2Heading: string
  memoryAltPrefix: string
  finalLabel: string
  finalHeading: string
  finalText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  yesAnswer: string
  heicAllFailed: string
  heicPartialPrefix: string
}

const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName.replace(/^\/+/, '')}`

const defaultHero = assetUrl('IMG_7069.jpg')
const ankuHero = assetUrl('IMG_7069.jpg')
const defaultStoryImage = assetUrl('AP1GczMH_-KJ9cVszt7V03uxTbKQbRVg.jpg')
const ankuStoryImage = assetUrl('AP1GczPBeafW1RaIrS-03wRQbmzKDvGC.jpg')

const fallbackPhotos = [
  assetUrl('AP1GczOEqpkwR3LQZUpJFng9azkRITu3.jpg'),
  assetUrl('AP1GczNefmEVguxJGFCi-_jo8Mq_jenu.jpg'),
  assetUrl('AP1GczMQDXBDM5UdIPfQi1F91MmLXuQH.jpg'),
  assetUrl('AP1GczPtNIq8UTr6MCxXNcEI004qiZBy.jpg'),
]

const ankuFallbackPhotos = [
  assetUrl('AP1GczMqSAJPdiNldlgPMx05hAIQ0A0Y.jpg'),
  assetUrl('AP1GczPMcOXpVkNxrO-egeYAC-QA1XgS.jpg'),
  assetUrl('AP1GczPiUurAYZKEFUYCjnwHH750ZODg.jpg'),
  assetUrl('AP1GczMHj_ZmO9F8xS4FM90FmEOzyDPI.jpg'),
]

const defaultContent: ContentCopy = {
  brand: 'Anku and Pintu',
  uploadButton: 'Upload your photos',
  heroEyebrow: '',
  heroTitle: 'Ankudi, will you be my Valentine?',
  heroLead:
    'You are the best thing that ever happened to me hanu, and I can\'t imagine myself without you. I promise to be with you always.',
  heroCta: 'Niche aur hai',
  chapter1Label: '',
  chapter1Heading: 'I want to explore the whole world with you, I can\'t wait for it.',
  chapter1Text:
    'Tum ho to lagta hai mil gayi har khushi, tum na ho ye lagta hai har khushi me hai kami',
  chapter2Label: 'My fatakdi is so pretty, I\'m truly very grateful for you hanudi❤️',
  chapter2Heading: 'I love you so much hanudi❤️❤️❤️❤️',
  memoryAltPrefix: 'Memory',
  finalLabel: '❤️❤️❤️❤️',
  finalHeading: 'Will you be my Valentine?',
  finalText: 'Koi bhi option select kar pankudi',
  optionA: 'Yes',
  optionB: 'Definitely yes',
  optionC: 'Option B',
  optionD: 'Option A',
  yesAnswer: '',
  heicAllFailed: 'Could not open selected HEIC files in this browser.',
  heicPartialPrefix: 'Some HEIC files could not be converted:',
}

const ankuContent: ContentCopy = {
  brand: 'Anku and Pintu',
  uploadButton: 'Upload photos',
  heroEyebrow: '',
  heroTitle: 'Aye shaane, valentine banega kya?',
  heroLead:
    'Agar tujhe nai banna to bhi thik hai, mujhe farak nai padta samja?',
  heroCta: 'Ye button daba battery',
  chapter1Label: 'Photo with momo',
  chapter1Heading: 'Stopped for a fan, he said he loves me, good for him',
  chapter1Text:
    'Abhi vaapas picture chaiye to 10,000 euros bhej dena, thx',
  chapter2Label: '(Special appearance Pinterest photo)',
  chapter2Heading: 'I like these pictures, lekin zyada ud mat ab samja?',
  memoryAltPrefix: 'Anku memory',
  finalLabel: '',
  finalHeading: 'Do you want to be my Valentine I guess?',
  finalText: 'Do we care? No, No but in yellow.',
  optionA: 'Yes',
  optionB: 'Definitely yes',
  optionC: 'Option B',
  optionD: 'Option A',
  yesAnswer: '',
  heicAllFailed: 'Anku mode could not open those HEIC files in this browser.',
  heicPartialPrefix: 'Some Anku HEIC files could not be converted:',
}

const floatingHeartOffsets = [8, 17, 29, 41, 58, 71, 84, 92]
const confettiColors = ['#ff6f83', '#ffbf9b', '#ffd86f', '#9ff3d9', '#9ec8ff', '#f8a4ff']

const isHeicFile = (file: File) => {
  const normalizedName = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    normalizedName.endsWith('.heic') ||
    normalizedName.endsWith('.heif')
  )
}

const convertHeicToJpeg = async (file: File): Promise<File> => {
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  })

  const convertedBlob = Array.isArray(converted) ? converted[0] : converted
  const outputName = file.name.replace(/\.(heic|heif)$/i, '.jpg')

  return new File([convertedBlob], outputName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

const createConfettiPieces = (count: number): ConfettiPiece[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    x: (Math.random() - 0.5) * 140,
    y: 45 + Math.random() * 70,
    rotation: (Math.random() - 0.5) * 1500,
    size: 7 + Math.random() * 10,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    delay: Math.random() * 180,
    duration: 1200 + Math.random() * 850,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }))

const createHeartPieces = (count: number): HeartPiece[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    size: 14 + Math.random() * 26,
    delay: Math.random() * 1800,
    duration: 3600 + Math.random() * 3000,
    drift: (Math.random() - 0.5) * 22,
    hue: 330 + Math.random() * 35,
  }))

function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
  const [answersByMode, setAnswersByMode] = useState<{ pintu: 'yes' | null; anku: 'yes' | null }>({
    pintu: null,
    anku: null,
  })
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})
  const [celebrating, setCelebrating] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])
  const [heartPieces, setHeartPieces] = useState<HeartPiece[]>([])
  const [cursorHearts, setCursorHearts] = useState<CursorHeart[]>([])
  const [showPrizeModal, setShowPrizeModal] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<UploadNotice | null>(null)
  const [isAnkuVersion, setIsAnkuVersion] = useState(false)
  const uploadedUrls = useRef<string[]>([])
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorHeartTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const cursorHeartLastSpawnRef = useRef(0)
  const cursorHeartIdRef = useRef(0)
  const memoriesSectionRef = useRef<HTMLElement | null>(null)

  const activePhoto = useMemo(
    () => photos.find((photo) => photo.id === activePhotoId) ?? null,
    [activePhotoId, photos],
  )

  const content = isAnkuVersion ? ankuContent : defaultContent
  const modeKey = isAnkuVersion ? 'anku' : 'pintu'
  const answer = answersByMode[modeKey]
  const activeHero = isAnkuVersion ? ankuHero : defaultHero
  const activeStoryImage = isAnkuVersion ? ankuStoryImage : defaultStoryImage
  const activeFallbackPhotos = isAnkuVersion ? ankuFallbackPhotos : fallbackPhotos
  const heroBackground = activePhoto?.url ?? activeHero
  const displayPhotos = photos.length > 0 ? photos.map((photo) => photo.url) : activeFallbackPhotos

  useEffect(() => {
    return () => {
      uploadedUrls.current.forEach((url) => URL.revokeObjectURL(url))
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
      cursorHeartTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    }
  }, [])

  useEffect(() => {
    const revealNodes = document.querySelectorAll<HTMLElement>('[data-reveal-id]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          const revealId = (entry.target as HTMLElement).dataset.revealId
          if (!revealId) {
            return
          }

          setVisibleSections((previous) => {
            if (previous[revealId]) {
              return previous
            }

            return { ...previous, [revealId]: true }
          })
        })
      },
      {
        threshold: 0.24,
      },
    )

    revealNodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (incomingFiles.length === 0) {
      return
    }

    setUploadNotice(null)

    const preparedFiles: File[] = []
    const failedHeicNames: string[] = []

    for (const file of incomingFiles) {
      if (!isHeicFile(file)) {
        preparedFiles.push(file)
        continue
      }

      try {
        const convertedFile = await convertHeicToJpeg(file)
        preparedFiles.push(convertedFile)
      } catch {
        failedHeicNames.push(file.name)
      }
    }

    if (preparedFiles.length === 0) {
      setUploadNotice({ kind: 'all_failed' })
      return
    }

    if (failedHeicNames.length > 0) {
      setUploadNotice({ kind: 'partial_failed', names: failedHeicNames })
    }

    const newPhotos = preparedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }))
    uploadedUrls.current.push(...newPhotos.map((photo) => photo.url))

    setPhotos((previousPhotos) => {
      const updatedPhotos = [...newPhotos, ...previousPhotos]
      if (!activePhotoId && updatedPhotos.length > 0) {
        setActivePhotoId(updatedPhotos[0].id)
      }
      return updatedPhotos
    })
  }

  const scrollToMemories = () => {
    memoriesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const spawnCursorHeart = (x: number, y: number) => {
    const id = cursorHeartIdRef.current++
    const heart: CursorHeart = {
      id,
      x,
      y,
      size: 14 + Math.random() * 14,
      rotation: (Math.random() - 0.5) * 34,
      hue: 326 + Math.random() * 36,
    }
    setCursorHearts((previous) => [...previous, heart])

    const timeoutId = setTimeout(() => {
      setCursorHearts((previous) => previous.filter((item) => item.id !== id))
    }, 900)
    cursorHeartTimeoutsRef.current.push(timeoutId)
  }

  const handlePageMouseMove = (event: MouseEvent<HTMLElement>) => {
    const now = performance.now()
    if (now - cursorHeartLastSpawnRef.current < 42) {
      return
    }

    cursorHeartLastSpawnRef.current = now
    spawnCursorHeart(event.clientX, event.clientY)
  }

  const handleYesClick = () => {
    setAnswersByMode((previous) => ({ ...previous, [modeKey]: 'yes' }))
    setCelebrating(true)
    setConfettiPieces(createConfettiPieces(90))
    setHeartPieces(createHeartPieces(65))
    setShowPrizeModal(!isAnkuVersion)

    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current)
    }

    celebrationTimeoutRef.current = setTimeout(() => {
      setCelebrating(false)
    }, 2300)
  }

  const quizOptions = [
    { key: 'A', label: content.optionA },
    { key: 'B', label: content.optionB },
    { key: 'C', label: content.optionC },
    { key: 'D', label: content.optionD },
  ]

  return (
    <main className="page" onMouseMove={handlePageMouseMove}>
      <div className="cursorHeartLayer" aria-hidden="true">
        {cursorHearts.map((heart) => {
          const cursorHeartStyle: CSSProperties & Record<'--size' | '--rot' | '--hue', string> = {
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            '--size': `${heart.size}px`,
            '--rot': `${heart.rotation}deg`,
            '--hue': `${heart.hue}`,
          }

          return (
            <span key={heart.id} className="cursorHeart" style={cursorHeartStyle}>
              {'\u2665'}
            </span>
          )
        })}
      </div>
      <section
        className="panel heroPanel"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 22%, rgba(255, 157, 146, 0.32), transparent 40%), url(${heroBackground})`,
        }}
      >
        <div className="floatingHearts" aria-hidden="true">
          {floatingHeartOffsets.map((offset, index) => (
            <span
              key={offset}
              className="floatingHeart"
              style={{
                left: `${offset}%`,
                animationDelay: `${index * 0.85}s`,
                animationDuration: `${7 + (index % 3)}s`,
              }}
            >
              *
            </span>
          ))}
        </div>

        <header className="topBar">
          <p className="brand">{content.brand}</p>
          <div className="topControls">
            <button
              type="button"
              className="versionButton isActive"
              onClick={() => setIsAnkuVersion((value) => !value)}
            >
              {isAnkuVersion ? 'Pintu version' : 'Anku version'}
            </button>
            <div className="uploadGroup">
              <label className="uploadButton">
                {content.uploadButton}
                <input type="file" accept="image/*,.heic,.heif" multiple onChange={handlePhotoUpload} />
              </label>
              {uploadNotice && (
                <p className="uploadNotice">
                  {uploadNotice.kind === 'all_failed'
                    ? content.heicAllFailed
                    : `${content.heicPartialPrefix} ${uploadNotice.names.join(', ')}`}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="heroContent reveal isVisible">
          <p className="heroEyebrow">{content.heroEyebrow}</p>
          <h1>
            {content.heroTitle.split('\n').map((line, index, lines) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < lines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="heroLead">{content.heroLead}</p>
          <div className="heroActions">
            <button type="button" onClick={scrollToMemories}>
              {content.heroCta}
            </button>
          </div>
        </div>
      </section>

      <section
        ref={memoriesSectionRef}
        className={`panel storyPanel reveal ${visibleSections.story ? 'isVisible' : ''}`}
        data-reveal-id="story"
      >
        <div className="storyText">
          <p className="sectionLabel">{content.chapter1Label}</p>
          <h2>{content.chapter1Heading}</h2>
          <p>{content.chapter1Text}</p>
        </div>
        <div className="storyImageFrame">
          <img src={activeStoryImage} alt={isAnkuVersion ? 'Anku story preview' : 'Romantic story preview'} />
        </div>
      </section>

      <section className={`panel galleryPanel reveal ${visibleSections.gallery ? 'isVisible' : ''}`} data-reveal-id="gallery">
        <div className="galleryHeader">
          <p className="sectionLabel">{content.chapter2Label}</p>
          <h2>{content.chapter2Heading}</h2>
        </div>
        <div className="galleryRail">
          {displayPhotos.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              className="memoryCard"
              style={{ animationDelay: `${index * 120}ms` }}
              onClick={() => {
                const selected = photos[index]
                if (selected) {
                  setActivePhotoId(selected.id)
                }
              }}
            >
              <img src={url} alt={`${content.memoryAltPrefix} ${index + 1}`} />
            </button>
          ))}
        </div>
      </section>

      <section className={`panel askPanel reveal ${visibleSections.ask ? 'isVisible' : ''}`} data-reveal-id="ask">
        {celebrating && (
          <div className="confettiLayer" aria-hidden="true">
            {confettiPieces.map((piece) => {
              const confettiStyle: CSSProperties &
                Record<'--x' | '--y' | '--rot', string> = {
                '--x': `${piece.x}vw`,
                '--y': `${piece.y}vh`,
                '--rot': `${piece.rotation}deg`,
                width: `${piece.size}px`,
                height: `${piece.shape === 'circle' ? piece.size : Math.max(6, piece.size * 0.58)}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}ms`,
                animationDuration: `${piece.duration}ms`,
              }

              return (
                <span
                  key={`${piece.id}-${piece.delay}`}
                  className={`confettiPiece ${piece.shape}`}
                  style={confettiStyle}
                />
              )
            })}
          </div>
        )}
        {answer === 'yes' && (
          <div className="heartRainLayer" aria-hidden="true">
            {heartPieces.map((heart) => {
              const heartStyle: CSSProperties &
                Record<'--left' | '--size' | '--delay' | '--duration' | '--drift', string> = {
                '--left': `${heart.left}%`,
                '--size': `${heart.size}px`,
                '--delay': `${heart.delay}ms`,
                '--duration': `${heart.duration}ms`,
                '--drift': `${heart.drift}vw`,
                color: `hsl(${heart.hue} 92% 71%)`,
              }

              return (
                <span key={heart.id} className="heartDrop" style={heartStyle}>
                  {'\u2665'}
                </span>
              )
            })}
          </div>
        )}
        {showPrizeModal && !isAnkuVersion && (
          <div className="prizeOverlay" onClick={() => setShowPrizeModal(false)}>
            <div className="prizeDialog" onClick={(event) => event.stopPropagation()}>
              <img src={assetUrl('7crore.gif')} alt="7 crore celebration" />
              <button type="button" className="prizeClose" onClick={() => setShowPrizeModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
        <div className={`askCard ${celebrating ? 'isCelebrating' : ''}`}>
          <p className="sectionLabel">{content.finalLabel}</p>
          <h2>
            {answer === 'yes'
              ? isAnkuVersion
                ? 'Not surprised, good for you.'
                : 'MY ANKUDI IS ONLY MINE!!!!!'
              : content.finalHeading}
          </h2>
          <p>{answer === 'yes' ? '' : content.finalText}</p>
          {answer === 'yes' ? (
            <div className="successGifWrap">
              <img
                src={isAnkuVersion ? assetUrl('unbothered-not-amused.gif') : assetUrl('tomjerry.gif')}
                alt="Celebration"
                className="successGif"
              />
            </div>
          ) : (
            <div className="millionaireOptions">
              {quizOptions.map((option) => (
                <button key={option.key} type="button" className="quizOption" onClick={handleYesClick}>
                  <span className="quizLetter">{option.key}</span>
                  <span className="quizText">{option.label}</span>
                </button>
              ))}
            </div>
          )}
          {answer === 'yes' && <p className="answer answerYes">{content.yesAnswer}</p>}
        </div>
      </section>
    </main>
  )
}

export default App
