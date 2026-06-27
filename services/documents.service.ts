import * as ImagePicker from 'expo-image-picker'
import { supabase, DocType, DocStatus } from '../lib/supabase'

const BUCKET = 'driver-docs'

// ─── PERMISSIONS CAMÉRA/GALERIE ───────────────────────────────────────────────
export async function requestMediaPermissions() {
  const cam    = await ImagePicker.requestCameraPermissionsAsync()
  const gallery = await ImagePicker.requestMediaLibraryPermissionsAsync()
  return { camera: cam.granted, gallery: gallery.granted }
}

// ─── CHOISIR UNE IMAGE (caméra ou galerie) ────────────────────────────────────
export async function pickDocument(source: 'camera' | 'gallery') {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality:    0.85,
    allowsEditing: false,
  }

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options)

  if (result.canceled) return null
  return result.assets[0]
}

// ─── UPLOAD D'UN DOCUMENT ─────────────────────────────────────────────────────
export async function uploadDocument(params: {
  driverId: string
  type:     DocType
  uri:      string
  mimeType?: string
  fileName?: string
}) {
  const { driverId, type, uri, mimeType = 'image/jpeg' } = params

  // Lire le fichier comme ArrayBuffer
  const response  = await fetch(uri)
  const arrayBuffer = await response.arrayBuffer()

  const ext       = mimeType.split('/')[1] ?? 'jpg'
  const filePath  = `${driverId}/${type}_${Date.now()}.${ext}`

  // Upload vers Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert:      true,
    })

  if (uploadError) throw uploadError

  // URL publique (signée 7 jours)
  const { data: urlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7)

  const fileUrl = urlData?.signedUrl ?? filePath

  // Enregistrer en base
  const { data, error } = await supabase
    .from('driver_documents')
    .upsert(
      {
        driver_id:  driverId,
        type,
        file_url:   fileUrl,
        file_name:  params.fileName ?? `${type}.${ext}`,
        file_size:  arrayBuffer.byteLength,
        mime_type:  mimeType,
        status:     'pending' as DocStatus,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: 'driver_id,type' }  // un seul doc par type par chauffeur
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── RÉCUPÉRER LES DOCUMENTS D'UN CHAUFFEUR ──────────────────────────────────
export async function getMyDocuments(driverId: string) {
  const { data, error } = await supabase
    .from('driver_documents')
    .select('*')
    .eq('driver_id', driverId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── ADMIN : LISTE TOUS LES DOSSIERS EN ATTENTE ───────────────────────────────
export async function getPendingDocDrivers() {
  const { data, error } = await supabase
    .from('pending_docs_view')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── ADMIN : APPROUVER / REFUSER UN DOCUMENT ──────────────────────────────────
export async function reviewDocument(params: {
  docId:        string
  status:       'approved' | 'rejected'
  rejectReason?: string
  reviewerId:   string
}) {
  const { error } = await supabase
    .from('driver_documents')
    .update({
      status:        params.status,
      reject_reason: params.rejectReason ?? null,
      reviewed_by:   params.reviewerId,
      reviewed_at:   new Date().toISOString(),
    })
    .eq('id', params.docId)

  if (error) throw error
}

// ─── URL SIGNÉE TEMPORAIRE (pour afficher en admin) ───────────────────────────
export async function getSignedUrl(filePath: string, expiresInSec = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresInSec)

  if (error) throw error
  return data.signedUrl
}
