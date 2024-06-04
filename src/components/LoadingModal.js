import React from 'react';
import { Modal, Spinner } from 'react-bootstrap'; // Подставьте свою библиотеку компонентов

const LoadingModal = () => {
  return (
    <Modal
      show={true}
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Body className="text-center">
        <Spinner animation="border" variant="primary" />
        <p>Loading...</p>
      </Modal.Body>
    </Modal>
  );
};

export default LoadingModal;