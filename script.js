import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Ganti dengan kredensial kamu
const SUPABASE_URL = 'https://oxxezxnivymttcfdxkrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eGV6eG5pdnltdHRjZmR4a3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MzkzNzcsImV4cCI6MjA2NzIxNTM3N30.iecyz7dkHC2BDGLypFYxrJ1bTmSvCukalo4PBlU5Cck';
const SUPABASE_TABLE_NAME = 'savings';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ambil data saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchSavings);

// Tambah Tabungan Baru
document.getElementById('addNewCardButton').addEventListener('click', showNewSavingForm);

async function fetchSavings() {
  const main = document.getElementById('mainContent');

  // Ambil data dari Supabase
  const { data, error } = await supabase.from(SUPABASE_TABLE_NAME).select('*');
  if (error) {
    console.error("Fetch error:", error.message);
    return;
  }

  // Hapus kartu lama
  const existingCards = main.querySelectorAll('.card:not(#addNewCardButton)');
  existingCards.forEach(card => card.remove());

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-card-id', item.id);

    const estimation = Math.ceil(item.targetAmount / item.savingRate);
    const percentage = Math.floor((item.currentAmount / item.targetAmount) * 100);

    card.innerHTML = `
      <div class="card-header">${item.title}</div>
      <div class="placeholder-image">
        <input type="file" accept="image/*" style="display: none;">
        <img class="uploaded-image-display" src="${item.imageUrl || ''}" style="${item.imageUrl ? 'display:block;' : 'display:none;'}">
        <span class="plusIconStyle" style="cursor:pointer; ${item.imageUrl ? 'display:none;' : ''}">+</span>
        <span class="edit-icon" style="${item.imageUrl ? 'display:inline-block;' : 'display:none;'}">&#9998;</span>
      </div>
      <div class="card-content">
        <div class="target-amount">
          <span>Rp. ${item.targetAmount.toLocaleString('id-ID')}</span>
        </div>
        <div class="weekly-saving">
          Rp. ${item.savingRate.toLocaleString('id-ID')}/${item.savingPeriod}
          <button class="add-button" data-card-id="${item.id}">+</button>
        </div>
      </div>
      <div class="estimation">Estimation: ${estimation} ${item.savingPeriod}</div>
      <div class="progress-container-with-percentage">
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <span class="progress-percentage-text">${percentage}%</span>
      </div>
    `;
    main.insertBefore(card, document.getElementById('addNewCardButton'));
  });

  // Tambahkan listener ke tombol '+'
  document.querySelectorAll('.add-button').forEach(button => {
    button.addEventListener('click', handleAddSaving);
  });

  // Upload gambar
  document.querySelectorAll('.plusIconStyle, .edit-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      const input = e.target.parentElement.querySelector('input[type="file"]');
      input.click();
    });
  });

  document.querySelectorAll('.placeholder-image input[type="file"]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const cardId = e.target.closest('.card').getAttribute('data-card-id');
      await uploadImage(file, cardId);
    });
  });
}

async function handleAddSaving(e) {
  const cardId = e.target.dataset.cardId;
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_NAME)
    .select('currentAmount, savingRate')
    .eq('id', cardId)
    .single();

  if (error || !data) {
    console.error("Gagal mengambil data:", error?.message);
    return;
  }

  const newAmount = data.currentAmount + data.savingRate;
  const { error: updateError } = await supabase
    .from(SUPABASE_TABLE_NAME)
    .update({ currentAmount: newAmount })
    .eq('id', cardId);

  if (updateError) {
    console.error("Update gagal:", updateError.message);
  } else {
    fetchSavings();
  }
}

async function showNewSavingForm() {
  const title = prompt("Judul Tabungan:");
  const targetAmount = parseInt(prompt("Target Dana (Rp):"));
  const savingRate = parseInt(prompt("Nabung per periode (Rp):"));
  const savingPeriod = prompt("Periode (contoh: Minggu)");

  if (!title || !targetAmount || !savingRate || !savingPeriod) {
    alert("Semua data wajib diisi!");
    return;
  }

  const { error } = await supabase.from(SUPABASE_TABLE_NAME).insert([{
    title,
    targetAmount,
    savingRate,
    savingPeriod,
    currentAmount: 0,
    imageUrl: ''
  }]);

  if (error) {
    alert("Gagal menambahkan tabungan");
    console.error("Insert error:", error.message);
  } else {
    fetchSavings();
  }
}

async function uploadImage(file, cardId) {
  const fileName = `saving-${cardId}-${Date.now()}.${file.name.split('.').pop()}`;
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("Upload error:", error.message);
    return;
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
  const { error: updateError } = await supabase
    .from(SUPABASE_TABLE_NAME)
    .update({ imageUrl: publicUrl })
    .eq('id', cardId);

  if (updateError) {
    console.error("Gagal update gambar:", updateError.message);
  } else {
    fetchSavings();
  }
}
