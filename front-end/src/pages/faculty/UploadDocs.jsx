import React, { useEffect, useRef, useState } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Upload, Trash2, X, FileText, AlertCircle } from 'lucide-react'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFileEmoji(name = '', mime = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext)) return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['xls','xlsx'].includes(ext)) return '📊'
  if (['ppt','pptx'].includes(ext)) return '📑'
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return '🖼️'
  if (['zip','rar','7z'].includes(ext)) return '🗜️'
  if (['mp4','mov','avi'].includes(ext)) return '🎬'
  return '📎'
}

export default function UploadDocs() {
  const [docs,        setDocs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [file,        setFile]        = useState(null)
  const [dragging,    setDragging]    = useState(false)
  const inputRef = useRef()

  const fetchDocs = async () => {
    try {
      const { data } = await API.get('/faculty/documents')
      setDocs(data.data || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file)        return toast.error('Please select a file')
    if (!title.trim()) return toast.error('Please enter a title')

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      await API.post('/faculty/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Notice uploaded! Students can now see it.')
      setTitle(''); setDescription(''); setFile(null)
      fetchDocs()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return
    try {
      await API.delete(`/faculty/documents/${id}`)
      toast.success('Notice deleted')
      setDocs(prev => prev.filter(d => d._id !== id))
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="page-enter">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Upload Notices / Docs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Upload notes, assignments, notices — visible to all students instantly
        </p>
      </div>

      {/* Upload Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{
          fontSize: '0.875rem', fontWeight: 700, marginBottom: 18,
          paddingBottom: 12, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Upload size={15} color="var(--accent)" />
          Post New Notice
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              required
              className="form-input"
              placeholder="e.g. Unit 2 Notes — Blockchain Technology"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Add context for students…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Drop Zone */}
          <div className="form-group">
            <label className="form-label">File *</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-lg)',
                background: dragging ? 'var(--accent-glow-lg)' : file ? '#f0fdf4' : 'var(--bg-elevated)',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: file ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>
                    {getFileEmoji(file.name, file.type)}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '0.9rem', marginBottom: 2,
                    color: 'var(--text-primary)',
                  }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    {formatSize(file.size)}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                  >
                    <X size={11} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: '0.875rem', marginBottom: 4,
                  }}>
                    Drop any file here or click to browse
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Any file type • Max 20 MB
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
              style={{ minWidth: 160, justifyContent: 'center' }}
            >
              {uploading
                ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</>
                : <><Upload size={14} /> Post Notice</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* My Uploads */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            My Posted Notices
            <span style={{
              marginLeft: 8, padding: '2px 8px',
              background: 'var(--accent-glow)', color: 'var(--accent)',
              borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
            }}>
              {docs.length}
            </span>
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
            <div className="spinner" /> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ marginBottom: 10, opacity: 0.25 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No notices posted yet</div>
            <div style={{ fontSize: '0.8rem' }}>Use the form above to share resources with students</div>
          </div>
        ) : (
          docs.map((doc, i) => (
            <div key={doc._id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {getFileEmoji(doc.originalName, doc.mimeType)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '0.875rem', color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {doc.title}
                </div>
                {doc.description && (
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {doc.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {doc.originalName}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {formatSize(doc.fileSize)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(doc._id)}
                className="btn btn-danger"
                style={{ padding: '5px 10px', flexShrink: 0 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}