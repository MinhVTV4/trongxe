document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const tripListView = document.getElementById('trip-list-view');
    const tripDetailView = document.getElementById('trip-detail-view');

    // Add Trip Form Elements
    const addTripToggleArea = document.getElementById('add-trip-toggle-area');
    const showAddTripFormBtn = document.getElementById('show-add-trip-form-btn');
    const addTripForm = document.getElementById('add-trip-form');
    const cancelAddTripBtn = document.getElementById('cancel-add-trip-btn');

    // Trip List Display Elements
    const tripListDiv = document.getElementById('trip-list');
    const tripListTitle = document.getElementById('trip-list-title');
    const viewModeToggleButton = document.getElementById('view-mode-toggle-btn');

    // Trip Detail View elements
    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailTripTitle = document.getElementById('detail-trip-title');
    const tripSummaryCompactDiv = document.getElementById('trip-summary-compact');
    const tripActionButtonsDiv = document.getElementById('trip-action-buttons'); // Nút chính
    const detailCardSecondaryActionsDiv = document.getElementById('detail-card-secondary-actions'); // Nút phụ
    const passengerListContainer = document.querySelector('.passenger-list-container');

    // Edit Trip Form Elements
    const editTripFormContainer = document.getElementById('edit-trip-form-container');
    const editTripForm = document.getElementById('edit-trip-form');
    const editTripIdInput = document.getElementById('edit-trip-id');
    const cancelEditTripBtn = document.getElementById('cancel-edit-trip-btn');

    // Passenger Management elements
    const addPassengerToggleArea = document.getElementById('add-passenger-toggle-area');
    const showAddPassengerFormBtn = document.getElementById('show-add-passenger-form-btn');
    const addPassengerForm = document.getElementById('add-passenger-form');
    const cancelAddPassengerBtn = document.getElementById('cancel-add-passenger-btn');
    const passengerListDiv = document.getElementById('passenger-list');
    const currentTripIdInput = document.getElementById('current-trip-id');

    // Wake Lock elements
    const wakeLockButton = document.getElementById('wake-lock-button');
    const wakeLockStatus = document.getElementById('wake-lock-status');

    // Backup & Restore elements
    const backupButton = document.getElementById('backup-button');
    const restoreButton = document.getElementById('restore-button');
    const backupDataTextarea = document.getElementById('backup-data-textarea');
    const restoreStatus = document.getElementById('restore-status');

    const STORAGE_KEY = 'xeGhepTrips_v13'; // Key for version 13

    // === Trip Status Constants ===
    const TRIP_STATUS = {
        UPCOMING: 'upcoming',
        RUNNING: 'running',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    };

    // === Application State ===
    let currentViewMode = 'active';

    // === Wake Lock Logic (Giữ nguyên) ===
    let wakeLockSentinel = null;
    const requestWakeLock = async () => { if ('wakeLock' in navigator) { try { wakeLockSentinel = await navigator.wakeLock.request('screen'); updateWakeLockStatus(true, "Đang giữ màn hình sáng."); wakeLockSentinel.addEventListener('release', () => { updateWakeLockStatus(false, "Đã tắt giữ màn hình sáng."); wakeLockSentinel = null; }); } catch (err) { console.error(`${err.name}, ${err.message}`); updateWakeLockStatus(false, `Lỗi: ${err.message}`, true); wakeLockSentinel = null; } } else { updateWakeLockStatus(false, "Trình duyệt không hỗ trợ giữ màn hình sáng.", false, true); } };
    const releaseWakeLock = async () => { if (wakeLockSentinel !== null) { try { await wakeLockSentinel.release(); } catch (err) { console.error(`Failed to release wake lock: ${err.name}, ${err.message}`); updateWakeLockStatus(false, "Lỗi khi tắt giữ sáng.", true); wakeLockSentinel = null; } } };
    const updateWakeLockStatus = (isActive, message, isError = false, isUnsupported = false) => { if (!wakeLockStatus || !wakeLockButton) return; wakeLockStatus.textContent = message; wakeLockStatus.className = 'status-indicator'; wakeLockButton.disabled = false; if (isActive) { wakeLockButton.classList.add('active'); wakeLockButton.innerHTML = '<span class="icon">💡</span> Tắt giữ sáng'; wakeLockStatus.classList.add('status-active'); } else { wakeLockButton.classList.remove('active'); wakeLockButton.innerHTML = '<span class="icon">💡</span> Giữ màn hình sáng'; if (isError) { wakeLockStatus.classList.add('status-error'); } else if (isUnsupported) { wakeLockStatus.classList.add('status-unsupported'); wakeLockButton.disabled = true; } } };
    if (wakeLockButton) { wakeLockButton.addEventListener('click', () => { if (wakeLockSentinel === null) { requestWakeLock(); } else { releaseWakeLock(); } }); }
    const handleVisibilityChange = () => { if (wakeLockSentinel !== null && document.visibilityState === 'hidden') { releaseWakeLock(); } };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!('wakeLock' in navigator)) { updateWakeLockStatus(false, "Trình duyệt không hỗ trợ giữ màn hình sáng.", false, true); }
    // === End Wake Lock Logic ===


    // === Data Handling (Giữ nguyên) ===
    function getTrips() { const tripsJson = localStorage.getItem(STORAGE_KEY); try { const trips = tripsJson ? JSON.parse(tripsJson) : []; if (!Array.isArray(trips)) { return []; } trips.forEach(trip => { if (!trip.status) { trip.status = TRIP_STATUS.UPCOMING; } }); trips.sort((a, b) => { const statusOrder = { [TRIP_STATUS.RUNNING]: 1, [TRIP_STATUS.UPCOMING]: 2, [TRIP_STATUS.COMPLETED]: 3, [TRIP_STATUS.CANCELLED]: 4 }; const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99); if (statusDiff !== 0) return statusDiff; const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`); const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`); if (isNaN(dateTimeA.getTime())) return 1; if (isNaN(dateTimeB.getTime())) return -1; if (currentViewMode === 'history') { return dateTimeB - dateTimeA; } return dateTimeA - dateTimeB; }); return trips; } catch (e) { console.error("Lỗi parse JSON từ localStorage:", e); localStorage.removeItem(STORAGE_KEY); return []; } }
    function saveTrips(trips) { if (!Array.isArray(trips)) { console.error("Lỗi: Dữ liệu cần lưu không phải là mảng."); return; } try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trips)); } catch (e) { console.error("Lỗi khi lưu vào localStorage:", e); alert("Đã có lỗi xảy ra khi lưu dữ liệu. LocalStorage có thể đã đầy."); } }
    function findTripById(tripId) { const trips = getTrips(); return trips.find(trip => trip.id === tripId); }
    function updateTripStatus(tripId, newStatus) { let trips = getTrips(); const tripIndex = trips.findIndex(t => t.id === tripId); if (tripIndex > -1) { trips[tripIndex].status = newStatus; saveTrips(trips); return true; } return false; }
    // === End Data Handling ===


    // === View Switching & Form Toggling ===
    function showTripListView() {
        tripDetailView.classList.add('hidden');
        tripListView.classList.remove('hidden');
        hideAddTripForm();
        hideEditTripForm();
        updateViewModeUI();
        displayTrips();
    }

    function showTripDetailView(tripId) {
        const trip = findTripById(tripId); if (!trip) { alert('Không tìm thấy chuyến đi!'); showTripListView(); return; }
        detailTripTitle.textContent = `Chi tiết: ${trip.origin} → ${trip.destination}`;
        displayTripSummaryCompact(trip);
        displayTripActionButtons(trip);
        displayPassengerList(trip); // Gọi hàm đã cập nhật
        currentTripIdInput.value = tripId;
        hideAddPassengerForm();
        hideEditTripForm();
        if (trip.status === TRIP_STATUS.RUNNING) { passengerListContainer.classList.add('running-mode'); } else { passengerListContainer.classList.remove('running-mode'); }
        if (trip.status === TRIP_STATUS.COMPLETED || trip.status === TRIP_STATUS.CANCELLED) { addPassengerToggleArea.classList.add('hidden'); hideAddPassengerForm(); } else { addPassengerToggleArea.classList.remove('hidden'); }
        tripListView.classList.add('hidden'); tripDetailView.classList.remove('hidden');
        // Không cuộn lên đầu ở đây nữa
    }

    // --- Add Trip Form Toggle ---
    function showAddTripForm() { if (addTripToggleArea && addTripForm) { addTripToggleArea.classList.add('hidden'); addTripForm.classList.remove('hidden'); addTripForm.reset(); addTripForm.querySelector('input[type="text"]')?.focus(); } }
    function hideAddTripForm() { if (addTripToggleArea && addTripForm) { addTripForm.classList.add('hidden'); addTripToggleArea.classList.remove('hidden'); addTripForm.reset(); } }
    // --- End Add Trip Form Toggle ---

    // --- Edit Trip Form Toggle ---
    function showEditTripForm(tripId) { const trip = findTripById(tripId); if (!trip || !editTripFormContainer || !editTripForm) return; editTripIdInput.value = trip.id; document.getElementById('edit-trip-origin').value = trip.origin; document.getElementById('edit-trip-destination').value = trip.destination; document.getElementById('edit-trip-date').value = trip.date; document.getElementById('edit-trip-time').value = trip.time; document.getElementById('edit-vehicle-seats').value = trip.vehicleSeats; document.getElementById('edit-price-per-seat').value = trip.pricePerSeat; document.getElementById('edit-trip-notes').value = trip.notes || ''; tripSummaryCompactDiv.classList.add('hidden'); tripActionButtonsDiv.classList.add('hidden'); detailCardSecondaryActionsDiv.classList.add('hidden'); editTripFormContainer.classList.remove('hidden'); editTripForm.querySelector('input[type="text"]')?.focus(); }
    function hideEditTripForm() { if (!editTripFormContainer || !editTripForm) return; editTripFormContainer.classList.add('hidden'); editTripForm.reset(); tripSummaryCompactDiv.classList.remove('hidden'); tripActionButtonsDiv.classList.remove('hidden'); detailCardSecondaryActionsDiv.classList.remove('hidden'); }
    // --- End Edit Trip Form Toggle ---

    // --- Add Passenger Form Toggle ---
    function showAddPassengerForm() { if (addPassengerToggleArea && addPassengerForm) { addPassengerToggleArea.classList.add('hidden'); addPassengerForm.classList.remove('hidden'); addPassengerForm.reset(); addPassengerForm.querySelector('input[type="text"]')?.focus(); } }
    function hideAddPassengerForm() { if (addPassengerToggleArea && addPassengerForm) { addPassengerForm.classList.add('hidden'); const tripId = currentTripIdInput.value; const trip = findTripById(tripId); if (trip && trip.status !== TRIP_STATUS.COMPLETED && trip.status !== TRIP_STATUS.CANCELLED) { addPassengerToggleArea.classList.remove('hidden'); } else { addPassengerToggleArea.classList.add('hidden'); } addPassengerForm.reset(); } }
    // --- End Add Passenger Form Toggle ---

    function updateViewModeUI() { if (currentViewMode === 'active') { tripListTitle.innerHTML = '<span class="icon">📑</span> Chuyến đi Sắp tới / Đang chạy'; viewModeToggleButton.textContent = 'Xem Lịch sử'; } else { tripListTitle.innerHTML = '<span class="icon">📜</span> Lịch sử Chuyến đi'; viewModeToggleButton.textContent = 'Xem Chuyến sắp tới'; } }
    // === End View Switching & Form Toggling ===


    // === Rendering Functions ===
    function displayTrips() { /* Giữ nguyên */ const allTrips = getTrips(); let tripsToDisplay; if (currentViewMode === 'active') { tripsToDisplay = allTrips.filter(trip => trip.status === TRIP_STATUS.UPCOMING || trip.status === TRIP_STATUS.RUNNING); } else { tripsToDisplay = allTrips.filter(trip => trip.status === TRIP_STATUS.COMPLETED || trip.status === TRIP_STATUS.CANCELLED); } tripListDiv.innerHTML = ''; if (tripsToDisplay.length === 0) { const message = currentViewMode === 'active' ? 'Không có chuyến đi nào sắp tới hoặc đang chạy.' : 'Lịch sử chuyến đi trống.'; tripListDiv.innerHTML = `<p>${message}</p>`; return; } tripsToDisplay.forEach(trip => { const tripElement = document.createElement('div'); tripElement.classList.add('trip-item'); tripElement.classList.add(`trip-status-${trip.status}`); tripElement.dataset.tripId = trip.id; const bookedSeats = calculateBookedSeats(trip); const availableSeats = trip.vehicleSeats - bookedSeats; const seatStatusColor = availableSeats <= 0 ? 'red' : (availableSeats < trip.vehicleSeats ? '#e08100' : 'green'); let statusText = ''; switch(trip.status) { case TRIP_STATUS.RUNNING: statusText = '<span style="color: blue; font-weight: bold;"> (Đang chạy)</span>'; break; case TRIP_STATUS.COMPLETED: statusText = '<span style="color: green;"> (Hoàn thành)</span>'; break; case TRIP_STATUS.CANCELLED: statusText = '<span style="color: grey; text-decoration: line-through;"> (Đã hủy)</span>'; break; } tripElement.innerHTML = `<h3>${trip.origin} → ${trip.destination}${statusText}</h3><p><strong>Ngày:</strong> ${formatDate(trip.date)} lúc ${trip.time}</p><p><strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ</p><p><strong>Chỗ:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / ${trip.vehicleSeats} (Còn: <span style="color: ${seatStatusColor}; font-weight: bold;">${availableSeats}</span>)</p>${trip.notes ? `<p><i>Ghi chú: ${trip.notes}</i></p>` : ''}<div class="trip-actions"><button class="action-button manage-btn" data-trip-id="${trip.id}">Xem Chi tiết</button>${trip.status !== TRIP_STATUS.COMPLETED && trip.status !== TRIP_STATUS.CANCELLED ? `<button class="action-button delete-btn" data-trip-id="${trip.id}">Xóa Chuyến</button>` : ''}</div>`; tripListDiv.appendChild(tripElement); }); }
    function displayTripSummaryCompact(trip) { /* Giữ nguyên */ const bookedSeats = calculateBookedSeats(trip); const availableSeats = trip.vehicleSeats - bookedSeats; let summaryHTML = `<div class="summary-item-label">Thời gian:</div><div class="summary-item-value">${formatDate(trip.date)} - ${trip.time}</div><div class="summary-item-label">Tình trạng chỗ:</div><div class="summary-item-value"><span class="seat-booked">${bookedSeats}</span> / ${trip.vehicleSeats} (<span class="seat-available">${availableSeats}</span> trống)</div><div class="summary-item-label">Giá vé:</div><div class="summary-item-value">${formatCurrency(trip.pricePerSeat)} / chỗ</div>`; if (trip.notes) { summaryHTML += `<div class="summary-item-label">Ghi chú:</div><div class="summary-item-value"><span class="trip-notes-value">${trip.notes}</span></div>`; } let statusText = ''; switch(trip.status) { case TRIP_STATUS.RUNNING: statusText = '<span style="color: blue; font-weight: bold;">Đang chạy</span>'; break; case TRIP_STATUS.COMPLETED: statusText = '<span style="color: green;">Hoàn thành</span>'; break; case TRIP_STATUS.CANCELLED: statusText = '<span style="color: grey; text-decoration: line-through;">Đã hủy</span>'; break; case TRIP_STATUS.UPCOMING: statusText = 'Sắp tới'; break; } summaryHTML += `<div class="summary-item-label">Trạng thái:</div><div class="summary-item-value">${statusText}</div>`; tripSummaryCompactDiv.innerHTML = summaryHTML; }
    function displayTripActionButtons(trip) { /* Giữ nguyên */ tripActionButtonsDiv.innerHTML = ''; detailCardSecondaryActionsDiv.innerHTML = ''; if (trip.status === TRIP_STATUS.UPCOMING) { const startButton = document.createElement('button'); startButton.innerHTML = '<span class="icon">▶️</span> Bắt đầu chuyến đi'; startButton.classList.add('action-button', 'start-trip-btn'); startButton.dataset.tripId = trip.id; tripActionButtonsDiv.appendChild(startButton); const cancelButton = document.createElement('button'); cancelButton.innerHTML = '<span class="icon">🚫</span> Hủy chuyến đi'; cancelButton.classList.add('action-button', 'cancel-trip-btn'); cancelButton.dataset.tripId = trip.id; tripActionButtonsDiv.appendChild(cancelButton); } else if (trip.status === TRIP_STATUS.RUNNING) { const endButton = document.createElement('button'); endButton.innerHTML = '<span class="icon">✅</span> Kết thúc chuyến đi'; endButton.classList.add('action-button', 'end-trip-btn'); endButton.dataset.tripId = trip.id; tripActionButtonsDiv.appendChild(endButton); } if (trip.status === TRIP_STATUS.UPCOMING) { const editButton = document.createElement('button'); editButton.innerHTML = '<span class="icon">✏️</span> Sửa'; editButton.title = 'Sửa thông tin chuyến đi'; editButton.classList.add('action-button', 'edit-trip-btn'); editButton.dataset.tripId = trip.id; detailCardSecondaryActionsDiv.appendChild(editButton); } const copyButton = document.createElement('button'); copyButton.innerHTML = '<span class="icon">📋</span> Sao chép'; copyButton.title = 'Sao chép chuyến đi này'; copyButton.classList.add('action-button', 'copy-trip-btn'); copyButton.dataset.tripId = trip.id; detailCardSecondaryActionsDiv.appendChild(copyButton); }

    // --- Cập nhật hàm này để bỏ nút "Ko đến" khi đang chạy ---
    function displayPassengerList(trip) {
        const passengers = trip.passengers || [];
        const tripStatus = trip.status;

        passengerListDiv.innerHTML = '';
        if (passengers.length === 0) {
             passengerListDiv.innerHTML = '<div class="passenger-item" style="border:none; justify-content: center; padding: 20px;">Chưa có hành khách nào cho chuyến này.</div>';
            return;
        }

        passengers.sort((a, b) => {
            const statusOrder = { 'booked': 1, 'picked_up': 2, 'dropped_off': 3, 'no_show': 4, 'cancelled': 5 };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });

        passengers.forEach((passenger) => {
            if (tripStatus === TRIP_STATUS.RUNNING && (passenger.status === 'cancelled' || passenger.status === 'no_show')) {
                return;
            }
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');
            passengerElement.classList.add(`status-${passenger.status}`);
            if (tripStatus === TRIP_STATUS.RUNNING && passenger.status === 'picked_up') {
                passengerElement.classList.add('picked-up');
            }

            const mapSearchUrl = "https://www.google.com/maps/search/?api=1&query=";
            const mapLinkPickup = `${mapSearchUrl}${encodeURIComponent(passenger.pickupAddress)}`;
            const mapLinkDropoff = `${mapSearchUrl}${encodeURIComponent(passenger.dropoffAddress)}`;

            const { statusText, statusClass } = getStatusInfo(passenger.status);
            const passengerIdentifier = `data-passenger-name="${passenger.name}" data-passenger-contact="${passenger.contact}"`;

            passengerElement.innerHTML = `
                <div class="col-name">
                    ${passenger.name}
                    <span class="seat-count">(${passenger.seatsBooked} chỗ)</span>
                    ${passenger.notes ? `<i title="${passenger.notes}">Ghi chú: ${passenger.notes}</i>` : ''}
                    ${tripStatus !== TRIP_STATUS.COMPLETED && tripStatus !== TRIP_STATUS.CANCELLED ? `<button class="delete-passenger-x-btn" title="Xóa khách này" data-trip-id="${trip.id}" ${passengerIdentifier}>×</button>` : ''}
                </div>
                <div class="col-contact">
                    <a href="tel:${passenger.contact}" title="Gọi ${passenger.name}"><span class="icon icon-phone">☎</span> ${passenger.contact}</a>
                </div>
                <div class="col-pickup">
                    ${passenger.pickupAddress}
                    <a href="${mapLinkPickup}" target="_blank" title="Xem bản đồ điểm đón"><span class="icon icon-map">📍</span></a>
                </div>
                <div class="col-dropoff">
                    ${passenger.dropoffAddress}
                    <a href="${mapLinkDropoff}" target="_blank" title="Xem bản đồ điểm trả"><span class="icon icon-map">📍</span></a>
                </div>
                <div class="col-status">
                    <span class="passenger-status ${statusClass}">${statusText}</span>
                </div>
                <div class="col-actions">
                    ${tripStatus !== TRIP_STATUS.COMPLETED && tripStatus !== TRIP_STATUS.CANCELLED && passenger.status === 'booked' ? `<button class="status-update-btn btn-pickup" data-trip-id="${trip.id}" ${passengerIdentifier} data-new-status="picked_up" title="Đánh dấu đã đón"><span class="icon">👍</span> Đón</button>` : ''}
                    ${tripStatus !== TRIP_STATUS.COMPLETED && tripStatus !== TRIP_STATUS.CANCELLED && passenger.status === 'picked_up' ? `<button class="status-update-btn btn-dropoff" data-trip-id="${trip.id}" ${passengerIdentifier} data-new-status="dropped_off" title="Đánh dấu đã trả"><span class="icon">🏁</span> Trả</button>` : ''}
                    ${tripStatus !== TRIP_STATUS.COMPLETED && tripStatus !== TRIP_STATUS.CANCELLED && passenger.status !== 'dropped_off' && passenger.status !== 'cancelled' ? `<button class="status-update-btn btn-cancel" data-trip-id="${trip.id}" ${passengerIdentifier} data-new-status="cancelled" title="Hủy chỗ của khách này"><span class="icon">❌</span> Hủy</button>` : ''}
                    ${tripStatus === TRIP_STATUS.UPCOMING && (passenger.status === 'booked' || passenger.status === 'picked_up') ? `<button class="status-update-btn btn-noshow" data-trip-id="${trip.id}" ${passengerIdentifier} data-new-status="no_show" title="Đánh dấu khách không đến"><span class="icon">👻</span> Ko đến</button>` : ''}
                    </div>
            `;
            passengerListDiv.appendChild(passengerElement);
        });
    }
    // --- Kết thúc displayPassengerList ---


    // === Helper Functions (Giữ nguyên) ===
    function calculateBookedSeats(trip) { if (!trip || !Array.isArray(trip.passengers)) return 0; return trip.passengers.reduce((sum, p) => (p.status !== 'cancelled' && p.status !== 'no_show') ? sum + p.seatsBooked : sum, 0); }
    function formatCurrency(amount) { if (isNaN(amount)) return "N/A"; return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }); }
    function formatDate(dateString) { if (!dateString) return "N/A"; try { const [year, month, day] = dateString.split('-'); if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) { throw new Error("Invalid date format (YYYY-MM-DD expected)"); } const date = new Date(year, month - 1, day); if (isNaN(date.getTime()) || date.getFullYear() !== parseInt(year) || date.getMonth() !== parseInt(month) - 1 || date.getDate() !== parseInt(day)) { throw new Error("Invalid date value"); } return `${day}/${month}/${year}`; } catch (e) { console.error("Lỗi định dạng ngày:", dateString, e); return dateString; } }
    function getStatusInfo(status) { switch (status) { case 'booked': return { statusText: 'Đã đặt', statusClass: 'status-booked' }; case 'picked_up': return { statusText: 'Đã đón', statusClass: 'status-picked_up' }; case 'dropped_off': return { statusText: 'Đã trả', statusClass: 'status-dropped_off' }; case 'cancelled': return { statusText: 'Đã hủy', statusClass: 'status-cancelled' }; case 'no_show': return { statusText: 'Không đến', statusClass: 'status-no_show' }; default: return { statusText: status || 'N/A', statusClass: '' }; } }
    // === End Helper Functions ===

    // === Backup & Restore Functions (Giữ nguyên) ===
    function backupData() { const trips = getTrips(); if (trips.length === 0) { backupDataTextarea.value = ""; alert("Không có dữ liệu chuyến đi nào để sao lưu."); return; } try { const backupJson = JSON.stringify(trips, null, 2); backupDataTextarea.value = backupJson; backupDataTextarea.select(); restoreStatus.textContent = "Dữ liệu đã được hiển thị trong ô. Hãy sao chép và lưu lại."; restoreStatus.className = 'status-indicator'; } catch (e) { console.error("Lỗi khi tạo JSON sao lưu:", e); alert("Đã có lỗi xảy ra khi tạo dữ liệu sao lưu."); restoreStatus.textContent = "Lỗi khi tạo dữ liệu sao lưu."; restoreStatus.className = 'status-indicator status-error'; } }
    function restoreData() { const backupJson = backupDataTextarea.value.trim(); if (!backupJson) { alert("Vui lòng dán dữ liệu đã sao lưu vào ô trước khi khôi phục."); return; } if (!confirm("CẢNH BÁO: Hành động này sẽ XÓA SẠCH toàn bộ dữ liệu chuyến đi hiện tại và thay thế bằng dữ liệu khôi phục. Bạn có chắc chắn muốn tiếp tục?")) { return; } try { const restoredTrips = JSON.parse(backupJson); if (!Array.isArray(restoredTrips)) { throw new Error("Dữ liệu khôi phục không hợp lệ (không phải là một danh sách)."); } saveTrips(restoredTrips); showTripListView(); backupDataTextarea.value = ""; restoreStatus.textContent = "Khôi phục dữ liệu thành công!"; restoreStatus.className = 'status-indicator status-success'; } catch (e) { console.error("Lỗi khi khôi phục dữ liệu:", e); alert(`Đã có lỗi xảy ra khi khôi phục dữ liệu: ${e.message}. Vui lòng kiểm tra lại dữ liệu đã dán.`); restoreStatus.textContent = `Lỗi khôi phục: ${e.message}`; restoreStatus.className = 'status-indicator status-error'; } }
    // === End Backup & Restore Functions ===


    // === Event Listeners ===

    // 1. Show Add Trip Form
    if (showAddTripFormBtn) { showAddTripFormBtn.addEventListener('click', showAddTripForm); }

    // 2. Cancel Add Trip Form
    if (cancelAddTripBtn) { cancelAddTripBtn.addEventListener('click', (event) => { event.preventDefault(); hideAddTripForm(); }); }

    // 3. Submit Add Trip Form
    if (addTripForm) { addTripForm.addEventListener('submit', (event) => { event.preventDefault(); const newTrip = { id: Date.now().toString() + Math.random().toString(36).substring(2, 8), origin: document.getElementById('trip-origin').value.trim(), destination: document.getElementById('trip-destination').value.trim(), date: document.getElementById('trip-date').value, time: document.getElementById('trip-time').value, vehicleSeats: parseInt(document.getElementById('vehicle-seats').value), pricePerSeat: parseInt(document.getElementById('price-per-seat').value), notes: document.getElementById('trip-notes').value.trim(), passengers: [], status: TRIP_STATUS.UPCOMING }; if (!newTrip.date || formatDate(newTrip.date) === newTrip.date) { alert('Ngày đi không hợp lệ.'); return; } if (!newTrip.origin || !newTrip.destination || !newTrip.time || isNaN(newTrip.vehicleSeats) || newTrip.vehicleSeats <= 0 || isNaN(newTrip.pricePerSeat)) { alert('Vui lòng nhập đủ thông tin.'); return; } const trips = getTrips(); trips.push(newTrip); saveTrips(trips); hideAddTripForm(); currentViewMode = 'active'; showTripListView(); }); }

    // 4. Click on Trip List (Manage/Delete Trip) (Giữ nguyên)
    tripListDiv.addEventListener('click', (event) => { const target = event.target.closest('button'); if (!target) return; const tripId = target.dataset.tripId; if (!tripId) return; if (target.classList.contains('manage-btn')) { showTripDetailView(tripId); } else if (target.classList.contains('delete-btn')) { const trip = findTripById(tripId); const tripName = trip ? `${trip.origin} → ${trip.destination} (${formatDate(trip.date)})` : "chuyến đi này"; if (confirm(`Xóa "${tripName}"?`)) { let trips = getTrips(); trips = trips.filter(t => t.id !== tripId); saveTrips(trips); displayTrips(); } } });

    // 5. Back to List from Detail View (Giữ nguyên)
    backToListBtn.addEventListener('click', showTripListView);

    // 6. Show Add Passenger Form (Giữ nguyên)
    showAddPassengerFormBtn.addEventListener('click', showAddPassengerForm);

    // 7. Cancel Adding Passenger (Giữ nguyên)
    cancelAddPassengerBtn.addEventListener('click', (event) => { event.preventDefault(); hideAddPassengerForm(); });

    // 8. Submit Add Passenger Form (Giữ nguyên logic cuộn lên đầu list)
    addPassengerForm.addEventListener('submit', (event) => { event.preventDefault(); const tripId = currentTripIdInput.value; if (!tripId) return; const trip = findTripById(tripId); if (!trip) { alert('Lỗi: Không tìm thấy chuyến đi.'); return; } const passengerName = document.getElementById('passenger-name').value.trim(); const passengerContact = document.getElementById('passenger-contact').value.trim(); const seatsBooked = parseInt(document.getElementById('passenger-seats').value); const pickupAddress = document.getElementById('passenger-pickup').value.trim(); const dropoffAddress = document.getElementById('passenger-dropoff').value.trim(); const passengerNotes = document.getElementById('passenger-notes').value.trim(); if (!passengerName || !passengerContact || isNaN(seatsBooked) || seatsBooked <= 0 || !pickupAddress || !dropoffAddress) { alert('Vui lòng nhập đủ thông tin khách.'); return; } const currentBookedSeats = calculateBookedSeats(trip); if (currentBookedSeats + seatsBooked > trip.vehicleSeats) { alert(`Không đủ chỗ! Chỉ còn ${trip.vehicleSeats - currentBookedSeats} chỗ.`); return; } const newPassenger = { name: passengerName, contact: passengerContact, seatsBooked: seatsBooked, pickupAddress: pickupAddress, dropoffAddress: dropoffAddress, notes: passengerNotes, status: 'booked' }; let trips = getTrips(); const tripIndex = trips.findIndex(t => t.id === tripId); if (tripIndex > -1) { const existingPassenger = trips[tripIndex].passengers.find(p => p.name === newPassenger.name && p.contact === newPassenger.contact && p.status !== 'cancelled'); if (existingPassenger) { if (!confirm(`Khách "${newPassenger.name}" (${newPassenger.contact}) đã tồn tại. Vẫn thêm?`)){ hideAddPassengerForm(); return; } } trips[tripIndex].passengers.push(newPassenger); saveTrips(trips); showTripDetailView(tripId); setTimeout(() => { const listContainer = document.querySelector('.passenger-list-container'); if (listContainer) { listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 150); hideAddPassengerForm(); } else { alert('Lỗi: Không tìm thấy chuyến đi.'); } });

     // 9. Click on Passenger List (Update Status / Delete Passenger) (Giữ nguyên logic cuộn lên đầu list)
     passengerListDiv.addEventListener('click', (event) => { const target = event.target.closest('button'); if (!target) return; const tripId = target.dataset.tripId; const passengerName = target.dataset.passengerName; const passengerContact = target.dataset.passengerContact; if (!tripId || passengerName === undefined || passengerContact === undefined) return; let trips = getTrips(); const tripIndex = trips.findIndex(t => t.id === tripId); if (tripIndex === -1) { console.error("Lỗi: Không tìm thấy chuyến đi."); return; } const passengerIndex = trips[tripIndex].passengers.findIndex(p => p.name === passengerName && p.contact === passengerContact); if (passengerIndex === -1) { console.warn("Cảnh báo: Không tìm thấy hành khách."); showTripDetailView(tripId); return; } const passengerData = { ...trips[tripIndex].passengers[passengerIndex] }; let needsSummaryUpdate = false; let shouldScrollToList = false; if (target.classList.contains('delete-passenger-x-btn')) { if (confirm(`Xóa khách "${passengerName}" (${passengerContact})?`)) { if (passengerData.status !== 'cancelled' && passengerData.status !== 'no_show') { needsSummaryUpdate = true; } trips[tripIndex].passengers.splice(passengerIndex, 1); saveTrips(trips); showTripDetailView(tripId); } } else if (target.classList.contains('status-update-btn')) { const newStatus = target.dataset.newStatus; const oldStatus = passengerData.status; const validStatuses = ['booked', 'picked_up', 'dropped_off', 'cancelled', 'no_show']; if (newStatus && validStatuses.includes(newStatus) && newStatus !== oldStatus) { if ((oldStatus !== 'cancelled' && oldStatus !== 'no_show') !== (newStatus !== 'cancelled' && newStatus !== 'no_show')) { needsSummaryUpdate = true; } trips[tripIndex].passengers[passengerIndex].status = newStatus; saveTrips(trips); if (newStatus === 'picked_up' || newStatus === 'dropped_off') { shouldScrollToList = true; } showTripDetailView(tripId); } else if (!newStatus || !validStatuses.includes(newStatus)) { console.warn("Trạng thái mới không hợp lệ:", newStatus); } } if (shouldScrollToList) { setTimeout(() => { const listContainer = document.querySelector('.passenger-list-container'); if (listContainer) { listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 150); } });

    // 10. Backup Button Listener (Giữ nguyên)
    if (backupButton) { backupButton.addEventListener('click', backupData); }

    // 11. Restore Button Listener (Giữ nguyên)
    if (restoreButton) { restoreButton.addEventListener('click', restoreData); }

    // 12. Chuyển đổi giữa View Active và History (Giữ nguyên)
    viewModeToggleButton.addEventListener('click', () => { currentViewMode = (currentViewMode === 'active') ? 'history' : 'active'; showTripListView(); });

    // 13. Xử lý các nút hành động CHÍNH của chuyến đi (Giữ nguyên)
    tripActionButtonsDiv.addEventListener('click', (event) => { const target = event.target.closest('button'); if (!target) return; const tripId = target.dataset.tripId; if (!tripId) return; if (target.classList.contains('start-trip-btn')) { handleStartTrip(tripId); } else if (target.classList.contains('end-trip-btn')) { handleEndTrip(tripId); } else if (target.classList.contains('cancel-trip-btn')) { handleCancelTrip(tripId); } });

    // 14. Listener cho các nút hành động PHỤ (Sửa/Sao chép) (Giữ nguyên)
    detailCardSecondaryActionsDiv.addEventListener('click', (event) => { const target = event.target.closest('button'); if (!target) return; const tripId = target.dataset.tripId; if (!tripId) return; if (target.classList.contains('edit-trip-btn')) { handleEditTrip(tripId); } else if (target.classList.contains('copy-trip-btn')) { handleCopyTrip(tripId); } });

    // --- Các hàm xử lý hành động chuyến đi (Giữ nguyên) ---
    function handleStartTrip(tripId) { if (updateTripStatus(tripId, TRIP_STATUS.RUNNING)) { showTripDetailView(tripId); } }
    function handleEndTrip(tripId) { if (updateTripStatus(tripId, TRIP_STATUS.COMPLETED)) { showTripListView(); } }
    function handleCancelTrip(tripId) { if (confirm("Hủy chuyến đi này?")) { if (updateTripStatus(tripId, TRIP_STATUS.CANCELLED)) { showTripListView(); } } }
    function handleEditTrip(tripId) { showEditTripForm(tripId); }
    function handleCopyTrip(tripId) { const originalTrip = findTripById(tripId); if (!originalTrip) { alert("Lỗi: Không tìm thấy chuyến đi gốc."); return; } const newTrip = { ...originalTrip, id: Date.now().toString() + Math.random().toString(36).substring(2, 8), status: TRIP_STATUS.UPCOMING, passengers: [] }; const trips = getTrips(); trips.push(newTrip); saveTrips(trips); alert(`Đã sao chép chuyến đi "${originalTrip.origin} → ${originalTrip.destination}".`); currentViewMode = 'active'; showTripListView(); }
    // --- Kết thúc các hàm xử lý ---

    // --- Event Listener cho Form Sửa Chuyến Đi (Giữ nguyên) ---
    if (editTripForm) { editTripForm.addEventListener('submit', (event) => { event.preventDefault(); const tripId = editTripIdInput.value; if (!tripId) { alert("Lỗi: Không xác định được chuyến đi."); return; } const updatedTripData = { origin: document.getElementById('edit-trip-origin').value.trim(), destination: document.getElementById('edit-trip-destination').value.trim(), date: document.getElementById('edit-trip-date').value, time: document.getElementById('edit-trip-time').value, vehicleSeats: parseInt(document.getElementById('edit-vehicle-seats').value), pricePerSeat: parseInt(document.getElementById('edit-price-per-seat').value), notes: document.getElementById('edit-trip-notes').value.trim(), }; if (!updatedTripData.date || formatDate(updatedTripData.date) === updatedTripData.date) { alert('Ngày đi không hợp lệ.'); return; } if (!updatedTripData.origin || !updatedTripData.destination || !updatedTripData.time || isNaN(updatedTripData.vehicleSeats) || updatedTripData.vehicleSeats <= 0 || isNaN(updatedTripData.pricePerSeat)) { alert('Vui lòng nhập đủ thông tin hợp lệ.'); return; } let trips = getTrips(); const tripIndex = trips.findIndex(t => t.id === tripId); if (tripIndex > -1) { trips[tripIndex] = { ...trips[tripIndex], ...updatedTripData }; saveTrips(trips); hideEditTripForm(); showTripDetailView(tripId); alert("Cập nhật thành công!"); } else { alert("Lỗi: Không tìm thấy chuyến đi."); hideEditTripForm(); } }); }

    // --- Event Listener cho nút Hủy Sửa (Giữ nguyên) ---
    if (cancelEditTripBtn) { cancelEditTripBtn.addEventListener('click', (event) => { event.preventDefault(); hideEditTripForm(); }); }


    // === Initial Load ===
    hideAddTripForm();
    hideEditTripForm();
    showTripListView();

}); // End DOMContentLoaded
