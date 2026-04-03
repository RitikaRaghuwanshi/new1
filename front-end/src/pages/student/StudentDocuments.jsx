import React, { useEffect, useState } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FileText, Download, Search, RefreshCw, Calendar, BookOpen, AlertCircle } from 'lucide-react'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFileEmoji(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📑'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬'
  return '📎'
}

export default function StudentDocuments() {
  const [docs, setDocs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [downloading, setDownloading] = useState(null)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/documents')
      setDocs(data.data || [])
      setFiltered(data.data || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(docs)
      return
    }
    const q = search.toLowerCase()
    setFiltered(docs.filter(d =>
      d.title?.toLowerCase().includes(q) ||
      d.subject?.toLowerCase().includes(q) ||
      d.facultyName?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    ))
  }, [search, docs])

  const handleDownload = async (doc) => {
    setDownloading(doc._id)
    try {
      const response = await API.get(`/documents/download/${doc._id}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.originalName || doc.title)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch {
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  // Group docs by subject
  const grouped = filtered.reduce((acc, doc) => {
    const key = doc.subject || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Study Materials
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Notes, assignments and notices posted by your faculty
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDocs}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }}
          />
          <input
            className="form-input"
            placeholder="Search by title, subject, or faculty…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)' }}>Loading documents…</span>
        </div>
      ) : docs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <BookOpen size={44} style={{ margin: '0 auto 14px', color: 'var(--border-light)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>
            No documents yet
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Your faculty hasn't uploaded any materials yet. Check back later.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <AlertCircle size={36} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Try a different search term.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([subject, subjectDocs]) => (
            <div key={subject} className="card" style={{ padding: 0 }}>
              {/* Subject header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--accent-glow)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={14} color="var(--accent)" />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '0.9rem',
                  }}>
                    {subject}
                  </span>
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: 99,
                  background: 'var(--accent-glow)', color: 'var(--accent)',
                  fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {subjectDocs.length} file{subjectDocs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Doc rows */}
              {subjectDocs.map((doc, i) => (
                <div
                  key={doc._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderBottom: i < subjectDocs.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}>
                    {getFileEmoji(doc.originalName)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '0.9rem', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {doc.title}
                    </div>
                    {doc.description && (
                      <div style={{
                        fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {doc.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      {doc.facultyName && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          By {doc.facultyName}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={10} />
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatSize(doc.fileSize)}
                      </span>
                    </div>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc._id}
                    className="btn btn-ghost"
                    style={{ padding: '7px 14px', fontSize: '0.8rem', flexShrink: 0 }}
                  >
                    {downloading === doc._id ? (
                      <><div className="spinner" style={{ width: 13, height: 13 }} /> Downloading…</>
                    ) : (
                      <><Download size={13} /> Download</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}