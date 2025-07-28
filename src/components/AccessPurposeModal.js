import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Backdrop,
} from "@mui/material";
import { useState } from "react";
import { useAnalytics, ACCESS_PURPOSES } from "../context/AnalyticsContext";

const AccessPurposeModal = () => {
  const { showPurposeModal, setAccessPurpose, skipPurposeSelection } =
    useAnalytics();
  const [selectedPurpose, setSelectedPurpose] = useState("");

  console.log("🎯 [AccessPurposeModal] 렌더링:", {
    showPurposeModal,
    selectedPurpose,
  });

  const handleConfirm = () => {
    console.log("✅ [AccessPurposeModal] 확인 버튼 클릭:", selectedPurpose);
    if (selectedPurpose) {
      setAccessPurpose(selectedPurpose);
      sessionStorage.setItem("accessPurpose", selectedPurpose);
    } else {
      console.warn("⚠️ [AccessPurposeModal] 선택된 목적이 없음");
    }
  };

  const handleSkip = () => {
    console.log("⏭️ [AccessPurposeModal] Skip 버튼 클릭");
    skipPurposeSelection();
    sessionStorage.setItem("accessPurpose", "Skipped");
  };

  return (
    <Dialog
      open={showPurposeModal}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      BackdropComponent={Backdrop}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 2,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <Box
          component="span"
          sx={{ fontSize: "1.5rem", fontWeight: "bold", color: "primary.main" }}
        >
          AWS Demo Factory 방문 목적
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography
            variant="body1"
            sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}
          >
            서비스 개선을 위해 방문 목적을 선택해 주세요.
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: "medium" }}>
              방문 목적을 선택하세요
            </FormLabel>
            <RadioGroup
              value={selectedPurpose}
              onChange={(e) => {
                console.log(
                  "🔘 [AccessPurposeModal] 라디오 버튼 선택:",
                  e.target.value
                );
                setSelectedPurpose(e.target.value);
              }}
              sx={{ gap: 1 }}
            >
              <FormControlLabel
                value={ACCESS_PURPOSES.AWS_INTERNAL}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      AWS Internal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AWS 내부 직원 또는 관련 업무
                    </Typography>
                  </Box>
                }
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 1,
                  m: 0,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              />

              <FormControlLabel
                value={ACCESS_PURPOSES.CUSTOMER_DEMO}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      고객사 데모 제공
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      고객사 대상 데모 및 프레젠테이션
                    </Typography>
                  </Box>
                }
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 1,
                  m: 0,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              />

              <FormControlLabel
                value={ACCESS_PURPOSES.OTHER}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      기타
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      학습, 연구 또는 기타 목적
                    </Typography>
                  </Box>
                }
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 1,
                  m: 0,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        <Button
          onClick={handleSkip}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 100 }}
        >
          Skip
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedPurpose}
          sx={{ minWidth: 100 }}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessPurposeModal;
